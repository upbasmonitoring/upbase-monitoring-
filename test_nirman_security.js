

const PW_API_KEY = 'pw_ffde84d43f88585cfebd08440f0881bf6728915521a7ab40';
const PW_URL = 'http://localhost:5000/api/security/report';

async function simulateNirmanSecurityReport() {
  console.log('--- Simulating Security Findings in Nirman Project ---');

  const reports = [
    {
      type: 'vulnerability',
      severity: 'high',
      message: 'Outdated version of "lodash" detected (4.17.11)',
      details: {
        path: 'nirman/package.json',
        cve: 'CVE-2019-10744',
        fix: 'upgrade to 4.17.21'
      }
    },
    {
      type: 'logic_bug',
      severity: 'medium',
      message: 'Insecure direct object reference (IDOR) in /api/users/:id',
      details: {
        file: 'nirman/server/routes/users.js',
        line: 42
      }
    }
  ];

  for (const report of reports) {
    try {
      console.log(`[NIRMAN] Reporting ${report.type}: ${report.message}...`);
      const response = await fetch(PW_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': PW_API_KEY
        },
        body: JSON.stringify({
          project: 'Nirman',
          ...report
        })
      });

      const data = await response.json();
      if (response.ok) {
        console.log(`✅ Success: Finding reported. ID: ${data.id}`);
      } else {
        console.error(`❌ Failed: ${data.message}`);
      }
    } catch (err) {
      console.error(`❌ Network Error: ${err.message}`);
    }
  }
}

simulateNirmanSecurityReport();
