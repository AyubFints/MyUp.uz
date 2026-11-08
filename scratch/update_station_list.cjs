const fs = require('fs');
const filePath = 'c:/Users/user/Desktop/MyUp/src/App.jsx';
let content = fs.readFileSync(filePath, 'utf8');

const targetLF = `                ) : (locationStatus === "denied" || locationStatus === "timeout" || locationStatus === "unsupported") && !userCoords ? (
                  <div className="location-denied-card">
                    <div className="location-denied-icon-wrap">
                      <MapPinOff size={28} />
                    </div>
                    <div className="location-denied-content">
                      <h4 className="location-denied-title">
                        {locationStatus === "denied" ? "Joylashuvga ruxsat berilmadi" : "Joylashuvni aniqlash cho'zildi"}
                      </h4>
                      <p className="location-denied-desc">
                        Shahobchalargacha bo'lgan masofani real hisoblash uchun joylashuvga (GPS) ruxsat bering.
                      </p>
                      <div className="location-denied-actions">
                        <button
                          type="button"
                          className="location-retry-btn"
                          onClick={requestLocation}
                        >
                          <LocateFixed size={16} />
                          <span>Qayta aniqlash</span>
                        </button>
                        <button
                          type="button"
                          className="location-fallback-btn"
                          onClick={handleUseDefaultLocation}
                        >
                          <span>Standart xarita bo'yicha ko'rish</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>`;

const replacementLF = `                ) : (
                  <>
                    {(locationStatus === "denied" || locationStatus === "timeout" || locationStatus === "unsupported") && !userCoords && (
                      <div className="location-denied-card" style={{ marginBottom: "16px" }}>
                        <div className="location-denied-icon-wrap">
                          <MapPinOff size={28} />
                        </div>
                        <div className="location-denied-content">
                          <h4 className="location-denied-title">
                            {locationStatus === "denied" ? "Joylashuvga ruxsat berilmadi" : "Joylashuvni aniqlash cho'zildi"}
                          </h4>
                          <p className="location-denied-desc">
                            Shahobchalargacha bo'lgan masofani real hisoblash uchun joylashuvga (GPS) ruxsat bering.
                          </p>
                          <div className="location-denied-actions">
                            <button
                              type="button"
                              className="location-retry-btn"
                              onClick={requestLocation}
                            >
                              <LocateFixed size={16} />
                              <span>Qayta aniqlash</span>
                            </button>
                            <button
                              type="button"
                              className="location-fallback-btn"
                              onClick={handleUseDefaultLocation}
                            >
                              <span>Standart xarita bo'yicha ko'rish</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}`;

if (content.includes(targetLF)) {
  content = content.replace(targetLF, replacementLF);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Successfully updated station list rendering condition (LF)');
} else {
  const targetCRLF = targetLF.replace(/\n/g, '\r\n');
  const replacementCRLF = replacementLF.replace(/\n/g, '\r\n');
  if (content.includes(targetCRLF)) {
    content = content.replace(targetCRLF, replacementCRLF);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Successfully updated station list rendering condition (CRLF)');
  } else {
    console.log('Target not found!');
  }
}
