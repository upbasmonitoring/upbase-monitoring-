import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

async function listModels() {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    // Note: The JS SDK doesn't have a direct 'listModels' method in the main class, 
    // it usually fetches via a REST endpoint internally.
    // However, we can try to fetch the list directly using fetch if we want to debug permissions.
    
    console.log('Testing key: ' + process.env.GEMINI_API_KEY.substring(0, 10) + '...');
    
    // Attempting a simple generation with a model that is ALMOST ALWAYS there
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent("hello");
    console.log("Success with gemini-1.5-flash");
  } catch (error) {
    console.error('Error Details:', error);
  }
}

listModels();
