const fs = require('fs');
const readline = require('readline');

async function processLineByLine() {
  const fileStream = fs.createReadStream('C:\\Users\\user\\.gemini\\antigravity-ide\\brain\\ebf62350-5ed1-48e7-b1f1-5bcd9b60f4a0\\.system_generated\\logs\\transcript_full.jsonl');

  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let latestFullFile = null;

  for await (const line of rl) {
    try {
      const parsed = JSON.parse(line);
      // look for view_file on App.css
      if (parsed.type === "TOOL_RESPONSE" && parsed.content && parsed.content.includes("File Path: `file:///c:/Users/user/Desktop/MyUp/src/App.css`")) {
          let lines = parsed.content.split('\n');
          let currentContent = [];
          for (let l of lines) {
              if (l.match(/^\d+:/)) {
                  currentContent.push(l.substring(l.indexOf(':') + 2));
              }
          }
          if (currentContent.length > 3000) {
              latestFullFile = currentContent.join('\n');
          }
      }
    } catch (e) {}
  }
  
  if (latestFullFile) {
      fs.writeFileSync('C:\\Users\\user\\Desktop\\MyUp\\recovered_App.css', latestFullFile);
      console.log("Recovered file with length: " + latestFullFile.length);
  } else {
      console.log("Could not find a full view_file of App.css");
  }
}

processLineByLine();
