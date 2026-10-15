import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import * as pmtiles from 'pmtiles';
import 'maplibre-gl/dist/maplibre-gl.css';

// Firebase import for demo purposes
// import { collection, getDocs } from 'firebase/firestore';
// import { db } from '../firebaseConfig';

const MapComponent = () => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [gasStations, setGasStations] = useState([]);

  useEffect(() => {
    // 1. PMTiles protokoli (agar oldin qo'shilmagan bo'lsa)
    const protocol = new pmtiles.Protocol();
    maplibregl.addProtocol('pmtiles', protocol.tile);

    // 2. Xaritani initsializatsiya qilish
    if (map.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        name: 'Dark Mode Roads',
        sources: {
          uzbekistan: {
            type: 'vector',
            url: 'pmtiles://http://localhost:5173/uzbekistan.pmtiles' // Bu yerda pmtiles faylingiz URL yoki joylashuvini yozasiz (public papkada bo'lsa)
          }
        },
        layers: [
          // Fon uchun qora rang
          {
            id: 'background',
            type: 'background',
            paint: {
              'background-color': '#111111' // Toza qora fon
            }
          },
          // Yo'llar uchun oddiy uslub
          {
            id: 'roads',
            type: 'line',
            source: 'uzbekistan',
            'source-layer': 'transportation', // tilemaker'ning config.json faylidagi qatlam (layer) nomi
            paint: {
              'line-color': '#333333',
              'line-width': 1.5
            }
          }
        ]
      },
      center: [69.2401, 41.2995], // Toshkent koordinatalari
      zoom: 12
    });

    // 3. Firebase'dan yoqilg'i shoxobchalarini yuklab olish va xaritaga marker qo'shish
    const fetchGasStations = async () => {
      try {
        // Haqiqiy loyihangizda firebase ma'lumotlarini shu yerdan olasiz:
        // const querySnapshot = await getDocs(collection(db, "gas_stations"));
        // const stationsData = querySnapshot.docs.map(doc => doc.data());
        
        // Bu vaqtinchalik namuna (mock) ma'lumot:
        const stationsData = [
          { id: 1, name: 'UzGaz', lat: 41.3000, lng: 69.2400 },
          { id: 2, name: 'Toshkent Petrol', lat: 41.3100, lng: 69.2500 }
        ];

        setGasStations(stationsData);

        // Markerlarni xaritaga qo'shish
        stationsData.forEach(station => {
          // Maxsus marker DOM elementi yaratish
          const el = document.createElement('div');
          el.className = 'gas-station-marker';
          el.style.width = '20px';
          el.style.height = '20px';
          el.style.backgroundColor = '#ffcc00'; // Sariq yoqilg'i belgisi
          el.style.borderRadius = '50%';
          el.style.border = '2px solid #000';
          el.style.cursor = 'pointer';

          new maplibregl.Marker(el)
            .setLngLat([station.lng, station.lat])
            .setPopup(new maplibregl.Popup({ offset: 25 }).setText(station.name))
            .addTo(map.current);
        });

      } catch (error) {
        console.error('Markerlarni yuklashda xatolik:', error);
      }
    };

    map.current.on('load', () => {
      fetchGasStations();
    });

    return () => {
      if (map.current) {
        maplibregl.removeProtocol('pmtiles');
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  return (
    <div style={{ width: '100%', height: '100vh', position: 'relative' }}>
      <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />
    </div>
  );
};

export default MapComponent;
