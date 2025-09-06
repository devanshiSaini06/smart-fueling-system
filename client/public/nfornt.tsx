import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { useState } from 'react';
import { Station } from '../types/Station';
import StationCard from '../components/StationCard';

const dummyStations: Station[] = [
  {
    id: 1,
    name: "Fuel Station A",
    location: { lat: 28.6139, lng: 77.2090 },
    queueTime: "10 mins",
    fuelAvailable: true
  },
  {
    id: 2,
    name: "Fuel Station B",
    location: { lat: 28.5355, lng: 77.3910 },
    queueTime: "5 mins",
    fuelAvailable: false
  }
];

const Home = () => {
  const [stations] = useState<Station[]>(dummyStations);

  return (
    <div className="h-screen flex">
      {/* Sidebar */}
      <div className="w-1/3 p-4 overflow-y-auto bg-gray-100">
        <h1 className="text-2xl font-bold mb-4">Nearby Fuel Stations</h1>
        {stations.map(station => (
          <div key={station.id} className="mb-4">
            <StationCard station={station} />
          </div>
        ))}
      </div>

      {/* Map */}
      <div className="w-2/3 h-full">
        <MapContainer center={[28.6139, 77.2090]} zoom={12} className="h-full w-full">
          <TileLayer
            attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {stations.map(station => (
            <Marker key={station.id} position={[station.location.lat, station.location.lng]}>
              <Popup>
                <div className="text-sm">
                  <strong>{station.name}</strong><br />
                  Queue: {station.queueTime}<br />
                  {station.fuelAvailable ? '✅ Fuel Available' : '❌ Out of Fuel'}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
};

export default Home;
