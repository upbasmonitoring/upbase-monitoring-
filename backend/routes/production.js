import express from 'express';
import { validateApiKey } from '../middleware/apiKeyAuth.js';
import { protect } from '../middleware/auth.js';
import ProductionError from '../models/ProductionError.js';
import Alert from '../models/Alert.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { triggerGitHubHealing } from '../selfHealingService.js';
import HealingLog from '../models/HealingLog.js';

const router = express.Router();

// @desc    Report a production error from external project
// @route   POST /api/production/report
// @access  Public (with API Key)
router.post('/report', validateApiKey, async (req, res) => {
  try {
    const { project, section, message, details, stack } = req.body;

    if (!project || !message) {
      return res.status(400).json({ message: 'Project name and error message are required' });
    }

    // Auto-Prioritization Logic (Simulated AI)
    let priority = 'medium';
    if (message.toLowerCase().includes('database') || message.toLowerCase().includes('payment')) priority = 'critical';
    else if (message.toLowerCase().includes('auth') || message.toLowerCase().includes('login')) priority = 'high';
    else if (message.toLowerCase().includes('not found') || message.toLowerCase().includes('404')) priority = 'low';

    const errorLog = await ProductionError.create({
      user: req.user._id,
      apiKey: req.apiKeyId,
      project,
      section: section || 'unknown',
      message,
      details,
      stack,
      priority,
    });

    // Simple notification log
    console.log(`[PRODUCTION ALERT] Priority: ${priority.toUpperCase()} | Error in project "${project}": ${message}`);

    // 🔧 AUTO-TRIGGER SELF-HEALING for high/critical errors
    if (priority === 'critical' || priority === 'high') {
      console.log(`[SELF-HEAL] Auto-triggering healing for ${priority} priority error...`);
      // Fire and forget — don't block the API response
      triggerGitHubHealing(errorLog).catch(e =>
        console.error('[SELF-HEAL] Background healing error:', e.message)
      );
    }
    
    res.status(201).json({
      success: true,
      message: 'Error reported successfully',
      id: errorLog._id,
      selfHealingTriggered: priority === 'critical' || priority === 'high'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get all production errors for the logged in user
// @route   GET /api/production/errors
// @access  Private
router.get('/errors', protect, async (req, res) => {
  try {
    const errors = await ProductionError.find({ user: req.user._id }).sort({ timestamp: -1 });
    res.json(errors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Analyze error with Gemini AI
// @route   GET /api/production/analyze/:id
// @access  Private
router.get('/analyze/:id', protect, async (req, res) => {
  try {
    const errorLog = await ProductionError.findById(req.params.id);
    if (!errorLog) {
      return res.status(404).json({ message: 'Error log not found' });
    }

    let analysis;

    // Check if Gemini API Key exists
    if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here') {
      try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const prompt = `
          As a senior software engineer, analyze this production error and provide a JSON response.
          
          ERROR DETAILS:
          Project: ${errorLog.project}
          Section: ${errorLog.section}
          Message: ${errorLog.message}
          Stack Trace: ${errorLog.stack || 'Not provided'}
          Metadata: ${JSON.stringify(errorLog.details)}
          
          REQUIRED JSON FORMAT:
          {
            "reason": "Clear explanation of why this failed",
            "solution": "Step by step fix instructions",
            "suggestion": "How to prevent this permanently",
            "codeFix": "The exact Javascript/Typescript code patch to fix this"
          }
          
          Respond ONLY with the JSON object.
        `;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        
        // Extract JSON from response (handling potential markdown blocks)
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(responseText);
        
        // Save the analysis to the DB
        errorLog.aiAnalysis = analysis;
        await errorLog.save();
        
      } catch (aiError) {
        console.error('Gemini Analysis failed, falling back to simulation:', aiError.message);
      }
    }

    // Fallback/Default Simulation if Gemini is not configured or fails
    if (!analysis) {
      analysis = {
        reason: `The error "${errorLog.message}" triggered a ${errorLog.priority} priority alert because it affects core functionality in ${errorLog.section}.`,
        solution: `FIX STEPS:\n1. Verify the connection string and environment variables.\n2. Add validation to the ${errorLog.section} input fields.\n3. Wrap the failing code in a circuit breaker to prevent system-wide failure.`,
        suggestion: "Consider upgrading the service endpoint to a higher-availability tier and adding redundant fallback nodes.",
        codeFix: "// Suggested Code Patch\ntry {\n  const result = await yourOperation();\n} catch (e) {\n  // Fallback Logic\n  console.error('Operation failed', e);\n}"
      };
    }

    res.json(analysis);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Mark error as resolved
// @route   PATCH /api/production/resolve/:id
// @access  Private
router.patch('/resolve/:id', protect, async (req, res) => {
  try {
    const errorLog = await ProductionError.findById(req.params.id);
    if (!errorLog) {
      return res.status(404).json({ message: 'Error log not found' });
    }
    errorLog.status = 'resolved';
    await errorLog.save();
    res.json({ message: 'Error marked as resolved' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Delete an error log
// @route   DELETE /api/production/delete/:id
// @access  Private
router.delete('/delete/:id', protect, async (req, res) => {
  try {
    const errorLog = await ProductionError.findById(req.params.id);
    if (!errorLog) {
      return res.status(404).json({ message: 'Error log not found' });
    }
    // Check if the user owns this error log
    if (errorLog.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    await errorLog.deleteOne();
    res.json({ message: 'Error log deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
