{
  "nodes": [
    {
      "parameters": {
        "rule": {
          "interval": [
            {
              "triggerAtHour": 10
            }
          ]
        }
      },
      "type": "n8n-nodes-base.scheduleTrigger",
      "typeVersion": 1.3,
      "position": [
        0,
        0
      ],
      "id": "cc6c1c96-5491-4447-98c1-4b65aceb0f27",
      "name": "Schedule Trigger"
    },
    {
      "parameters": {
        "operation": "get",
        "dataTableId": {
          "__rl": true,
          "value": "evBUjLZ1EvOOgbWz",
          "mode": "list",
          "cachedResultName": "SSL Health Monitor",
          "cachedResultUrl": "/projects/3FwiRKktcDxLG0l5/datatables/evBUjLZ1EvOOgbWz"
        },
        "matchType": "allConditions",
        "returnAll": true
      },
      "type": "n8n-nodes-base.dataTable",
      "typeVersion": 1,
      "position": [
        272,
        0
      ],
      "id": "1207d03b-2df8-4b35-8bcc-11471e6aa388",
      "name": "Get row(s)"
    },
    {
      "parameters": {
        "content": "## 🕒 Daily Trigger\nMenjalankan alur kerja setiap hari pukul 10:00 pagi.\n\nSesuaikan waktu atau frekuensi sesuai kebutuhan menggunakan pengaturan cron atau interval.",
        "height": 368
      },
      "type": "n8n-nodes-base.stickyNote",
      "typeVersion": 1,
      "position": [
        -64,
        -192
      ],
      "id": "9ba8fbe2-eaf2-4ebb-8290-957af54a760b",
      "name": "Sticky Note2"
    },
    {
      "parameters": {
        "content": "## 🌐 Fetch URLs\nMembaca URL situs web dari Data Table.\n\nPastikan lembar kerja memiliki kolom bernama `domain` yang berisi domain yang ingin Anda pantau.",
        "height": 368
      },
      "type": "n8n-nodes-base.stickyNote",
      "typeVersion": 1,
      "position": [
        208,
        -192
      ],
      "id": "5a381288-0c10-4cae-b9a2-b32f8e1f6afe",
      "name": "Sticky Note3"
    },
    {
      "parameters": {
        "content": "## 🔍 Check SSL\nMengakses `ssl-checker.io` (API gratis) untuk data sertifikat SSL setiap domain.\n\nMengembalikan informasi valid_from, valid_till, days_left, dan host.",
        "height": 368
      },
      "type": "n8n-nodes-base.stickyNote",
      "typeVersion": 1,
      "position": [
        528,
        -400
      ],
      "id": "e846450e-aca5-40cd-a507-9f4088ac3e10",
      "name": "Sticky Note"
    },
    {
      "parameters": {
        "content": "### 🔍 Check SSL health score\nGunakan sysadmin-toolkit/scripts/ssl/ssl-health-assessment.js\n\nMengembalikan nilai keseluruhan SSL, kerentanan, dan tindakan yang perlu diambil.",
        "height": 320,
        "width": 520
      },
      "id": "e57adbef-235b-4b11-ac47-f2c2df80fa3d",
      "name": "Sticky Note7",
      "type": "n8n-nodes-base.stickyNote",
      "position": [
        800,
        48
      ],
      "typeVersion": 1
    },
    {
      "parameters": {
        "command": "=node /home/jackalope/n8n-utils/sysadmin-toolkit/scripts/ssl/ssl-health-assessment.js {{ $json.domain }} --json"
      },
      "type": "n8n-nodes-base.ssh",
      "typeVersion": 1,
      "position": [
        848,
        192
      ],
      "id": "de076100-6139-40f1-bfa0-859c1298484d",
      "name": "Execute a command",
      "credentials": {
        "sshPassword": {
          "id": "OC7BhVlnWEdWGqWp",
          "name": "SSH home server"
        }
      }
    },
    {
      "parameters": {
        "jsCode": "// n8n Code Node - Parse SSL Scanner Output\n// This code processes the SSH node output and formats it for Discord notifications\n\nconst results = [];\n\nfor (const item of $input.all()) {\n  try {\n    // Extract the stdout from SSH response\n    const sshOutput = item.json;\n    \n    // Check if SSH command was successful\n    if (sshOutput.code !== 0) {\n      results.push({\n        json: {\n          hostname: 'unknown',\n          status: 'error',\n          error: sshOutput.stderr || 'SSH command failed',\n          alert: true,\n          alertLevel: 'critical'\n        }\n      });\n      continue;\n    }\n    \n    // Parse the JSON output from stdout\n    let sslData;\n    try {\n      sslData = JSON.parse(sshOutput.stdout);\n    } catch (parseError) {\n      results.push({\n        json: {\n          hostname: 'unknown',\n          status: 'error',\n          error: 'Failed to parse SSL scanner output',\n          alert: true,\n          alertLevel: 'critical'\n        }\n      });\n      continue;\n    }\n    \n    // Extract key information for Discord notification\n    const parsedResult = {\n      // Basic info\n      hostname: sslData.hostname,\n      port: sslData.port || 443,\n      scanTime: sslData.scanTime,\n      scanDuration: sslData.scanDuration,\n      \n      // Overall status\n      overallGrade: sslData.overallGrade,\n      connectionStatus: sslData.connectionStatus || 'unknown',\n      success: sslData.success || false,\n      \n      // Certificate info\n      certificate: {\n        subject: sslData.certificate?.subject || 'unknown',\n        issuer: sslData.certificate?.issuer || 'unknown',\n        validUntil: sslData.certificate?.validUntil,\n        daysUntilExpiry: sslData.certificate?.daysUntilExpiry,\n        isValid: sslData.certificate?.isValid || false,\n        issues: sslData.certificate?.issues || [],\n        hostnameMatch: sslData.certificate?.hostnameMatch || false\n      },\n      \n      // Protocol support\n      protocols: {\n        tls13: sslData.protocols?.tls13 || false,\n        tls12: sslData.protocols?.tls12 || false,\n        tls11: sslData.protocols?.tls11 || false,\n        tls10: sslData.protocols?.tls10 || false,\n        ssl3: sslData.protocols?.ssl3 || false\n      },\n      \n      // Security info\n      vulnerabilities: {\n        hasVulnerabilities: sslData.vulnerabilities?.hasVulnerabilities || false,\n        poodle: sslData.vulnerabilities?.poodle || false,\n        freak: sslData.vulnerabilities?.freak || false,\n        details: sslData.vulnerabilities || {}\n      },\n      \n      // Grades breakdown\n      grades: sslData.grades || {},\n      \n      // Recommendations\n      recommendations: sslData.recommendations || [],\n      \n      // Error handling\n      error: sslData.error,\n      \n      // Alert logic\n      alert: false,\n      alertLevel: 'info',\n      alertReasons: []\n    };\n    \n    // Determine if this needs an alert\n    const alertReasons = [];\n    let alertLevel = 'info';\n    \n    // Critical alerts\n    if (sslData.error) {\n      alertReasons.push(`Scan failed: ${sslData.error}`);\n      alertLevel = 'critical';\n    }\n    \n    if (!parsedResult.certificate.isValid) {\n      alertReasons.push('Certificate is invalid');\n      alertLevel = 'critical';\n    }\n    \n    if (parsedResult.certificate.daysUntilExpiry <= 0) {\n      alertReasons.push('Certificate has expired');\n      alertLevel = 'critical';\n    }\n    \n    // High priority alerts\n    if (parsedResult.certificate.daysUntilExpiry <= 7 && parsedResult.certificate.daysUntilExpiry > 0) {\n      alertReasons.push(`Certificate expires in ${parsedResult.certificate.daysUntilExpiry} days`);\n      if (alertLevel === 'info') alertLevel = 'high';\n    }\n    \n    if (parsedResult.vulnerabilities.hasVulnerabilities) {\n      alertReasons.push('Security vulnerabilities detected');\n      if (alertLevel === 'info') alertLevel = 'high';\n    }\n    \n    if (!parsedResult.certificate.hostnameMatch) {\n      alertReasons.push('Hostname mismatch detected');\n      if (alertLevel === 'info') alertLevel = 'high';\n    }\n    \n    // Medium priority alerts\n    if (parsedResult.certificate.daysUntilExpiry <= 30 && parsedResult.certificate.daysUntilExpiry > 7) {\n      alertReasons.push(`Certificate expires in ${parsedResult.certificate.daysUntilExpiry} days`);\n      if (alertLevel === 'info') alertLevel = 'medium';\n    }\n    \n    if (['C', 'D', 'F'].includes(parsedResult.overallGrade)) {\n      alertReasons.push(`Poor SSL grade: ${parsedResult.overallGrade}`);\n      if (alertLevel === 'info') alertLevel = 'medium';\n    }\n    \n    if (parsedResult.protocols.ssl3 || parsedResult.protocols.tls10) {\n      alertReasons.push('Deprecated protocols enabled');\n      if (alertLevel === 'info') alertLevel = 'medium';\n    }\n    \n    // Low priority alerts\n    if (parsedResult.recommendations && parsedResult.recommendations.length > 0) {\n      alertReasons.push(`${parsedResult.recommendations.length} recommendations available`);\n      if (alertLevel === 'info') alertLevel = 'low';\n    }\n    \n    // Set alert status\n    parsedResult.alert = alertReasons.length > 0;\n    parsedResult.alertLevel = alertLevel;\n    parsedResult.alertReasons = alertReasons;\n    \n    // Add Discord formatting helpers\n    parsedResult.discord = {\n      color: getDiscordColor(alertLevel, parsedResult.overallGrade),\n      title: `SSL Health Check: ${parsedResult.hostname}`,\n      description: getDiscordDescription(parsedResult),\n      fields: getDiscordFields(parsedResult),\n      timestamp: new Date().toISOString(),\n      \n      // Pre-formatted content for easy Discord input\n      content: alertLevel === 'critical' ? '@here 🚨 SSL Health Monitor Alert' : '🔐 SSL Health Monitor Alert',\n      \n      // Simple descriptions without complex logic\n      simpleDescription: parsedResult.alert \n        ? `⚠️ SSL issues detected for ${parsedResult.hostname}`\n        : `✅ SSL looks healthy for ${parsedResult.hostname}`,\n        \n      // Detailed info as simple strings\n      certificateInfo: `Grade: ${parsedResult.overallGrade} | Expires in ${parsedResult.certificate.daysUntilExpiry} days`,\n      \n      // Alert details as simple string\n      alertSummary: parsedResult.alert \n        ? `Issues: ${parsedResult.alertReasons.join(', ')}`\n        : `Certificate expires ${parsedResult.certificate.validUntil}`,\n        \n      // Complete formatted description\n      fullDescription: getFullDiscordDescription(parsedResult)\n    };\n    \n    results.push({ json: parsedResult });\n    \n  } catch (error) {\n    // Handle any unexpected errors\n    results.push({\n      json: {\n        hostname: 'unknown',\n        status: 'error',\n        error: `Processing error: ${error.message}`,\n        alert: true,\n        alertLevel: 'critical'\n      }\n    });\n  }\n}\n\n// Helper functions for Discord formatting\nfunction getDiscordColor(alertLevel, grade) {\n  // Color mapping for Discord embeds\n  const colors = {\n    critical: 15158332, // Red\n    high: 15105570,     // Orange\n    medium: 15844367,   // Yellow\n    low: 5763719,       // Blue\n    info: 5763719       // Blue\n  };\n  \n  // Grade-based colors for non-alerts\n  const gradeColors = {\n    'A+': 5763719,  // Green\n    'A': 3066993,   // Green\n    'B': 15844367,  // Yellow\n    'C': 15105570,  // Orange\n    'D': 15158332,  // Red\n    'F': 10038562   // Dark Red\n  };\n  \n  if (alertLevel !== 'info') {\n    return colors[alertLevel] || colors.info;\n  }\n  \n  return gradeColors[grade] || colors.info;\n}\n\nfunction getFullDiscordDescription(result) {\n  if (result.error) {\n    return `❌ SSL scan failed: ${result.error}`;\n  }\n  \n  if (result.alert) {\n    let description = `⚠️ SSL issues detected for ${result.hostname}\\n`;\n    description += `Grade: ${result.overallGrade} | Expires in ${result.certificate.daysUntilExpiry} days\\n\\n`;\n    description += `Issues found:\\n`;\n    result.alertReasons.forEach(reason => {\n      description += `• ${reason}\\n`;\n    });\n    return description.trim();\n  }\n  \n  return `✅ SSL configuration looks good for ${result.hostname}\\nGrade: ${result.overallGrade} | Certificate expires in ${result.certificate.daysUntilExpiry} days`;\n}\n\nfunction getDiscordDescription(result) {\n  if (result.error) {\n    return `❌ SSL scan failed: ${result.error}`;\n  }\n  \n  if (result.alert) {\n    // Create simple alert description\n    let description = \"⚠️ SSL issues detected:\\n\";\n    result.alertReasons.forEach(reason => {\n      description += `• ${reason}\\n`;\n    });\n    return description.trim();\n  }\n  \n  return `✅ SSL configuration looks good\\nGrade: ${result.overallGrade} | Expires in ${result.certificate.daysUntilExpiry} days`;\n}\n\nfunction getDiscordFields(result) {\n  const fields = [];\n  \n  // Certificate info\n  fields.push({\n    name: \"📜 Certificate\",\n    value: [\n      `**Subject:** ${result.certificate.subject}`,\n      `**Issuer:** ${result.certificate.issuer}`,\n      `**Expires:** ${new Date(result.certificate.validUntil).toLocaleDateString()}`,\n      `**Days Left:** ${result.certificate.daysUntilExpiry}`\n    ].join('\\n'),\n    inline: true\n  });\n  \n  // Security info\n  fields.push({\n    name: \"🔐 Security\",\n    value: [\n      `**Overall Grade:** ${result.overallGrade}`,\n      `**TLS 1.2:** ${result.protocols.tls12 ? '✅' : '❌'}`,\n      `**TLS 1.3:** ${result.protocols.tls13 ? '✅' : '❌'}`,\n      `**Vulnerabilities:** ${result.vulnerabilities.hasVulnerabilities ? '⚠️ Found' : '✅ None'}`\n    ].join('\\n'),\n    inline: true\n  });\n  \n  // Add recommendations if any\n  if (result.recommendations.length > 0) {\n    fields.push({\n      name: \"💡 Recommendations\",\n      value: result.recommendations.slice(0, 3).map(rec => `• ${rec.message || rec}`).join('\\n') + \n             (result.recommendations.length > 3 ? `\\n... and ${result.recommendations.length - 3} more` : ''),\n      inline: false\n    });\n  }\n  \n  return fields;\n}\n\nreturn results;"
      },
      "id": "46010982-4ab1-458c-8a26-0413933da48c",
      "name": "Code - Format output",
      "type": "n8n-nodes-base.code",
      "position": [
        1024,
        192
      ],
      "typeVersion": 2
    },
    {
      "parameters": {
        "chatId": "-4801374672",
        "text": "={{ $json.discord.title }}\n\n{{ $json.discord.fullDescription }}",
        "additionalFields": {}
      },
      "type": "n8n-nodes-base.telegram",
      "typeVersion": 1.2,
      "position": [
        1424,
        176
      ],
      "id": "590dc753-457b-4ca0-a927-d71229e4f036",
      "name": "Send a text message",
      "webhookId": "04870de9-5cf5-42e6-b83f-7e367b25f9cc",
      "credentials": {
        "telegramApi": {
          "id": "Me05EVNtQFYXIg9c",
          "name": "Jacl SSL Checker"
        }
      }
    },
    {
      "parameters": {
        "content": "## ⚠️ Expiry Alert\nMemeriksa apakah `days_left` kurang dari atau sama dengan 7.\nHanya domain yang memenuhi kondisi ini yang akan memicu peringatan email.",
        "height": 368
      },
      "type": "n8n-nodes-base.stickyNote",
      "typeVersion": 1,
      "position": [
        800,
        -400
      ],
      "id": "6792d477-ce79-42fb-8cb2-b17b8733619d",
      "name": "Sticky Note1"
    },
    {
      "parameters": {
        "chatId": "-4801374672",
        "text": "=*⚠️ ATTENTION ⚠️*\nSSL Certificate Expiry Reminder\n\n*Domain:* {{ $json.result.host }}  \n*Remaining:* {{ $json.result.days_left }} days Left\n\n*Harap segera lakukan pengecekan dan perpanjangan sebelum masa berlaku habis.*",
        "additionalFields": {}
      },
      "type": "n8n-nodes-base.telegram",
      "typeVersion": 1.2,
      "position": [
        1152,
        -224
      ],
      "id": "9576a5c3-db0b-4db6-b5bb-d01985c4ef11",
      "name": "Send a text message1",
      "webhookId": "04870de9-5cf5-42e6-b83f-7e367b25f9cc",
      "credentials": {
        "telegramApi": {
          "id": "Me05EVNtQFYXIg9c",
          "name": "Jacl SSL Checker"
        }
      }
    },
    {
      "parameters": {
        "conditions": {
          "options": {
            "caseSensitive": true,
            "leftValue": "",
            "typeValidation": "strict",
            "version": 3
          },
          "conditions": [
            {
              "id": "ab6f1b89-6a50-40bb-bc29-ce0edb50caf5",
              "leftValue": "={{ $json.result.days_left }}",
              "rightValue": 7,
              "operator": {
                "type": "number",
                "operation": "lte"
              }
            }
          ],
          "combinator": "and"
        },
        "options": {}
      },
      "type": "n8n-nodes-base.if",
      "typeVersion": 2.3,
      "position": [
        864,
        -208
      ],
      "id": "3fead7fc-e1d6-4e51-931f-53c74ed796b1",
      "name": "If"
    },
    {
      "parameters": {
        "content": "### 📧 Send Telegram alerts\nMengirimkan peringatan jika ada masalah.",
        "height": 320,
        "width": 260
      },
      "id": "9e17c2dc-b1f3-4d0d-b3f1-78abc82ea5f1",
      "name": "Sticky Note5",
      "type": "n8n-nodes-base.stickyNote",
      "position": [
        1072,
        -352
      ],
      "typeVersion": 1,
      "disabled": true
    },
    {
      "parameters": {
        "content": "## 🔍 Check Port\nJika pada domain ada port yang digunakan, maka akan di `parse` terlebih dahulu.",
        "height": 320
      },
      "type": "n8n-nodes-base.stickyNote",
      "typeVersion": 1,
      "position": [
        528,
        48
      ],
      "id": "2034ef1b-d960-4a3e-8e67-4e9683c96fc7",
      "name": "Sticky Note4"
    },
    {
      "parameters": {
        "content": "### 📧 Send Telegram alerts\nMengirimkan peringatan jika ada masalah.",
        "height": 320,
        "width": 260
      },
      "id": "0cc9017d-ca87-44b0-80a0-6575ed6fe968",
      "name": "Sticky Note6",
      "type": "n8n-nodes-base.stickyNote",
      "position": [
        1344,
        48
      ],
      "typeVersion": 1,
      "disabled": true
    },
    {
      "parameters": {
        "url": "=https://ssl-checker.io/api/v1/check/{{ $json.domain }}",
        "options": {}
      },
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.3,
      "position": [
        592,
        -208
      ],
      "id": "e6f6bf40-b369-4ee7-bd3a-1e12105a7231",
      "name": "Check SSL1"
    },
    {
      "parameters": {
        "conditions": {
          "options": {
            "caseSensitive": true,
            "leftValue": "",
            "typeValidation": "strict",
            "version": 3
          },
          "conditions": [
            {
              "id": "c2fa00fa-dd62-4d8b-803b-44e0a5e1e39e",
              "leftValue": "={{ $json.overallGrade }}",
              "rightValue": "A+",
              "operator": {
                "type": "string",
                "operation": "notEquals"
              }
            }
          ],
          "combinator": "and"
        },
        "options": {}
      },
      "type": "n8n-nodes-base.if",
      "typeVersion": 2.3,
      "position": [
        1184,
        192
      ],
      "id": "b8caf594-c59d-4e6d-8104-369079636297",
      "name": "If1"
    },
    {
      "parameters": {
        "jsCode": "return items.map(item => {\n  const domain = item.json.domain;\n\n  item.json.domain = domain.replace(\":\", \" \");\n\n  return item;\n});\n"
      },
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [
        592,
        192
      ],
      "id": "5af494d1-9b87-4f26-95e5-e6dd2a7ff159",
      "name": "Code - Split Host and Port"
    }
  ],
  "connections": {
    "Schedule Trigger": {
      "main": [
        [
          {
            "node": "Get row(s)",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Get row(s)": {
      "main": [
        [
          {
            "node": "Code - Split Host and Port",
            "type": "main",
            "index": 0
          },
          {
            "node": "Check SSL1",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Execute a command": {
      "main": [
        [
          {
            "node": "Code - Format output",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Code - Format output": {
      "main": [
        [
          {
            "node": "If1",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "If": {
      "main": [
        [
          {
            "node": "Send a text message1",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Check SSL1": {
      "main": [
        [
          {
            "node": "If",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "If1": {
      "main": [
        [
          {
            "node": "Send a text message",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Code - Split Host and Port": {
      "main": [
        [
          {
            "node": "Execute a command",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  },
  "pinData": {},
  "meta": {
    "templateCredsSetupCompleted": true,
    "instanceId": "031e4bd7f37d89d819a5656b2788ca1984c04118be9298e24324de0cb0bede47"
  }
}