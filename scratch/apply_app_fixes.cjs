const fs = require('fs');
const filePath = 'c:/Users/user/Desktop/MyUp/src/App.jsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add static import StationDetailModal and remove lazy
const oldImports = `import PhoneEditModal from "./components/PhoneEditModal";
import AuthScreen from "./components/AuthScreen";`;
const newImports = `import PhoneEditModal from "./components/PhoneEditModal";
import AuthScreen from "./components/AuthScreen";
import StationDetailModal from "./components/StationDetailModal";`;

if (content.includes(oldImports)) {
  content = content.replace(oldImports, newImports);
  console.log('1. Added static import for StationDetailModal');
}

const lazyStationDetail = `const StationDetailModal = lazy(() => import("./components/StationDetailModal"));\r\n`;
const lazyStationDetailLF = `const StationDetailModal = lazy(() => import("./components/StationDetailModal"));\n`;
if (content.includes(lazyStationDetail)) {
  content = content.replace(lazyStationDetail, '');
  console.log('1b. Removed lazy StationDetailModal (CRLF)');
} else if (content.includes(lazyStationDetailLF)) {
  content = content.replace(lazyStationDetailLF, '');
  console.log('1b. Removed lazy StationDetailModal (LF)');
}

// 2. Fix showSplash and handleSplashComplete
const oldSplashBlock = `  const [showSplash, setShowSplash] = useState(() => {
    const savedUser = localStorage.getItem("myup_user");
    const splashShown = sessionStorage.getItem("myup_splash_shown");
    return Boolean(savedUser) && !splashShown;
  });

  const handleSplashComplete = () => {
    sessionStorage.setItem("myup_splash_shown", "true");
    setShowSplash(false);
  };`;

const newSplashBlock = `  const [showSplash, setShowSplash] = useState(() => {
    try {
      const splashShown = sessionStorage.getItem("myup_splash_shown");
      return !splashShown;
    } catch {
      return false;
    }
  });

  const handleSplashComplete = useCallback(() => {
    try {
      sessionStorage.setItem("myup_splash_shown", "true");
    } catch {}
    setShowSplash(false);
  }, []);`;

if (content.includes(oldSplashBlock)) {
  content = content.replace(oldSplashBlock, newSplashBlock);
  console.log('2. Updated showSplash and handleSplashComplete (LF)');
} else {
  // Try CRLF
  const oldSplashBlockCRLF = oldSplashBlock.replace(/\n/g, '\r\n');
  const newSplashBlockCRLF = newSplashBlock.replace(/\n/g, '\r\n');
  if (content.includes(oldSplashBlockCRLF)) {
    content = content.replace(oldSplashBlockCRLF, newSplashBlockCRLF);
    console.log('2. Updated showSplash and handleSplashComplete (CRLF)');
  } else {
    console.log('2. Old splash block not found!');
  }
}

// 3. Cached stations initialization
const oldStationsInit = `  const [isStationsLoading, setIsStationsLoading] = useState(true);
  const [stations, setStations] = useState(() => {
    try {
      const storedRatings = JSON.parse(localStorage.getItem("myup_custom_ratings") || "{}");
      return INITIAL_STATIONS.map((s) => {
        if (storedRatings[s.id]) {
          return {
            ...s,
            rating: storedRatings[s.id].rating,
            reviewsCount: (s.reviewsCount || 1) + storedRatings[s.id].count,
          };
        }
        return s;
      });
    } catch (e) {
      return INITIAL_STATIONS;
    }
  });`;

const newStationsInit = `  const [isStationsLoading, setIsStationsLoading] = useState(true);
  const [stations, setStations] = useState(() => {
    try {
      const cached = localStorage.getItem("myup_cached_stations");
      const baseStations = cached ? JSON.parse(cached) : INITIAL_STATIONS;
      const storedRatings = JSON.parse(localStorage.getItem("myup_custom_ratings") || "{}");
      return (Array.isArray(baseStations) && baseStations.length > 0 ? baseStations : INITIAL_STATIONS).map((s) => {
        if (storedRatings[s.id]) {
          return {
            ...s,
            rating: storedRatings[s.id].rating,
            reviewsCount: (s.reviewsCount || 1) + storedRatings[s.id].count,
          };
        }
        return s;
      });
    } catch (e) {
      return INITIAL_STATIONS;
    }
  });`;

if (content.includes(oldStationsInit)) {
  content = content.replace(oldStationsInit, newStationsInit);
  console.log('3. Updated stations state initialization (LF)');
} else {
  const oldStationsInitCRLF = oldStationsInit.replace(/\n/g, '\r\n');
  const newStationsInitCRLF = newStationsInit.replace(/\n/g, '\r\n');
  if (content.includes(oldStationsInitCRLF)) {
    content = content.replace(oldStationsInitCRLF, newStationsInitCRLF);
    console.log('3. Updated stations state initialization (CRLF)');
  } else {
    console.log('3. Old stations init not found!');
  }
}

// 4. Save to cache & fallback in loadStationsFromDb
const oldDbSet = `        setStations(mergedStations);`;
const newDbSet = `        setStations(mergedStations);
        try {
          localStorage.setItem("myup_cached_stations", JSON.stringify(mergedStations));
        } catch (e) {}`;

if (content.includes(oldDbSet)) {
  content = content.replace(oldDbSet, newDbSet);
  console.log('4. Added cache save on DB fetch success');
}

const oldDbCatch = `    } catch (err) {
      console.warn("Shahobchalarni bazadan yuklashda xato:", err.message);
    } finally {`;

const newDbCatch = `    } catch (err) {
      console.warn("Shahobchalarni bazadan yuklashda xato:", err.message);
      try {
        const cached = localStorage.getItem("myup_cached_stations");
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setStations(parsed);
          }
        }
      } catch (e) {}
    } finally {`;

if (content.includes(oldDbCatch)) {
  content = content.replace(oldDbCatch, newDbCatch);
  console.log('4b. Added cache fallback on DB fetch catch (LF)');
} else {
  const oldDbCatchCRLF = oldDbCatch.replace(/\n/g, '\r\n');
  const newDbCatchCRLF = newDbCatch.replace(/\n/g, '\r\n');
  if (content.includes(oldDbCatchCRLF)) {
    content = content.replace(oldDbCatchCRLF, newDbCatchCRLF);
    console.log('4b. Added cache fallback on DB fetch catch (CRLF)');
  } else {
    console.log('4b. Old DB catch not found!');
  }
}

// 5. requestLocation fallback coords
const oldLocDenied = `        setTimeout(() => {
          setLocationStatus("denied");
          setIsLocating(false);
        }, remaining);`;

const newLocDenied = `        setTimeout(() => {
          setLocationStatus("denied");
          setIsLocating(false);
          setUserCoords((prev) => prev || { lat: 41.311081, lng: 69.240562 });
        }, remaining);`;

if (content.includes(oldLocDenied)) {
  content = content.replace(oldLocDenied, newLocDenied);
  console.log('5. Added fallback coords on GPS denied (LF)');
} else {
  const oldLocDeniedCRLF = oldLocDenied.replace(/\n/g, '\r\n');
  const newLocDeniedCRLF = newLocDenied.replace(/\n/g, '\r\n');
  if (content.includes(oldLocDeniedCRLF)) {
    content = content.replace(oldLocDeniedCRLF, newLocDeniedCRLF);
    console.log('5. Added fallback coords on GPS denied (CRLF)');
  }
}

const oldLocTimeout = `        setLocationStatus((prev) => (prev === "locating" ? "timeout" : prev));
        setIsLocating(false);
      }`;

const newLocTimeout = `        setLocationStatus((prev) => (prev === "locating" ? "timeout" : prev));
        setIsLocating(false);
        setUserCoords((prev) => prev || { lat: 41.311081, lng: 69.240562 });
      }`;

if (content.includes(oldLocTimeout)) {
  content = content.replace(oldLocTimeout, newLocTimeout);
  console.log('5b. Added fallback coords on GPS timeout (LF)');
} else {
  const oldLocTimeoutCRLF = oldLocTimeout.replace(/\n/g, '\r\n');
  const newLocTimeoutCRLF = newLocTimeout.replace(/\n/g, '\r\n');
  if (content.includes(oldLocTimeoutCRLF)) {
    content = content.replace(oldLocTimeoutCRLF, newLocTimeoutCRLF);
    console.log('5b. Added fallback coords on GPS timeout (CRLF)');
  }
}

// 6. Fix Suspense on StationDetailModal
const oldModalRender = `      {Boolean(detailStation) && (
        <Suspense fallback={null}>
          <StationDetailModal
            station={detailStation}
            userDistance={
              detailStation
                ? calculateDistance(
                    userCoords?.lat,
                    userCoords?.lng,
                    detailStation.lat,
                    detailStation.lng,
                  )
                : 0
            }
            onClose={() => setDetailStation(null)}
            onStartNavigation={(target) => setNavigationTarget(target)}
            onRateStation={handleRateStation}
            isMyStation={myStations.some((s) => s.id === detailStation?.id)}
            onDeleteStation={(st) => setStationToDelete(st)}
            onManageStation={(st) => {
              setSelectedManageStationId(st.id);
              setActiveTab('my');
            }}
          />
        </Suspense>
      )}`;

const newModalRender = `      {Boolean(detailStation) && (
        <StationDetailModal
          station={detailStation}
          userDistance={
            detailStation
              ? calculateDistance(
                  userCoords?.lat,
                  userCoords?.lng,
                  detailStation.lat,
                  detailStation.lng,
                )
              : 0
          }
          onClose={() => setDetailStation(null)}
          onStartNavigation={(target) => setNavigationTarget(target)}
          onRateStation={handleRateStation}
          isMyStation={myStations.some((s) => s.id === detailStation?.id)}
          onDeleteStation={(st) => setStationToDelete(st)}
          onManageStation={(st) => {
            setSelectedManageStationId(st.id);
            setActiveTab('my');
          }}
        />
      )}`;

if (content.includes(oldModalRender)) {
  content = content.replace(oldModalRender, newModalRender);
  console.log('6. Removed Suspense wrapper on StationDetailModal (LF)');
} else {
  const oldModalRenderCRLF = oldModalRender.replace(/\n/g, '\r\n');
  const newModalRenderCRLF = newModalRender.replace(/\n/g, '\r\n');
  if (content.includes(oldModalRenderCRLF)) {
    content = content.replace(oldModalRenderCRLF, newModalRenderCRLF);
    console.log('6. Removed Suspense wrapper on StationDetailModal (CRLF)');
  } else {
    console.log('6. Old modal render not found!');
  }
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Done updating App.jsx');
