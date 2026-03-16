// fixViaRest.js
import fs from 'fs';
import os from 'os';
import path from 'path';

const configPath = path.join(os.homedir(), '.config', 'configstore', 'firebase-tools.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const accessToken = config.tokens.access_token;
const projectId = 'psylogos-enigma-da-mente';

async function fixUser() {
  const query = {
    structuredQuery: {
      from: [{ collectionId: "participantes" }],
      where: {
        fieldFilter: {
          field: { fieldPath: "user.nickname" },
          op: "EQUAL",
          value: { stringValue: "Captão" }
        }
      }
    }
  };

  const res = await fetch(`https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:runQuery`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(query)
  });

  const data = await res.json();
  if (data[0] && data[0].document) {
      const doc = data[0].document;
      const id = doc.name;
      console.log('Found user:', id);
      const points = parseInt(doc.fields.user.mapValue.fields.points.integerValue);
      console.log('Points:', points);
      
      const LEVEL_THRESHOLDS = [
        0, 160, 320, 480, 640, 800, 960, 1120, 1280, 1440, 1600, 1760, 1920, 2080,
        2240, 2400, 2560, 2720, 2880, 3040, 3200,
      ];
      let correctLevel = 1;
      for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
        if (points >= LEVEL_THRESHOLDS[i]) {
          correctLevel = i + 1;
          break;
        }
      }
      console.log('Correct level:', correctLevel);

      // Now update the document using PATCH
      // We only update the user.level field
      const updateMask = 'updateMask.fieldPaths=user.level';
      
      const patchRes = await fetch(`https://firestore.googleapis.com/v1/${id}?${updateMask}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fields: {
            user: {
                mapValue: {
                    fields: {
                        ...doc.fields.user.mapValue.fields,
                        level: { integerValue: correctLevel }
                    }
                }
            }
          }
        })
      });

      const patchData = await patchRes.json();
      console.log('Update response:', patchData);
  } else {
      console.log('User not found or error:', data);
  }
}

fixUser();
