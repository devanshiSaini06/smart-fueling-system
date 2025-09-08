import React, { useState, useEffect, useMemo } from "react";
import {
  GoogleMap,
  LoadScript,
  Marker,
  InfoWindow,
} from "@react-google-maps/api";
import usePlacesAutocomplete, { getGeocode, getLatLng } from "use-places-autocomplete";

/* =========================
   Dark (night) map styles
   ========================= */
const nightModeMapStyles = [
  { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
  { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#263c3f" }] },
  { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#6b9a76" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#212a37" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#9ca5b3" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#746855" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#1f2835" }] },
  { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#f3d19c" }] },
  { featureType: "transit", elementType: "geometry", stylers: [{ color: "#2f3948" }] },
  { featureType: "transit.station", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#515c6d" }] },
  { featureType: "water", elementType: "labels.text.stroke", stylers: [{ color: "#17263c" }] },
];

/* =========================
   ReviewForm (top-level component)
   ========================= */
function ReviewForm({ stationId, addReview }) {
  const [name, setName] = useState("");
  const [text, setText] = useState("");

  const submit = () => {
    if (!text.trim()) {
      alert("Please write a short review.");
      return;
    }
    addReview(stationId, name.trim() || "Anonymous", text.trim());
    setName("");
    setText("");
    alert("Thanks — review posted!");
  };

  return (
    <div className="mt-3">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Name (optional)"
        className="w-full p-2 border rounded text-sm mb-2 dark:bg-gray-700 dark:text-white"
      />
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Write a short review..."
        className="w-full p-2 border rounded text-sm mb-2 dark:bg-gray-700 dark:text-white"
        rows={3}
      />
      <div className="flex gap-2">
        <button onClick={submit} className="px-3 py-1 bg-green-600 text-white rounded">Submit</button>
      </div>
    </div>
  );
}

/* =========================
   Main Component
   ========================= */
export default function SmartFuelingSystem() {
  const [selected, setSelected] = useState(null);
  const [mapCenter, setMapCenter] = useState({ lat: 28.7041, lng: 77.1025 });
  const [fuelFilter, setFuelFilter] = useState("all");
  const [dark, setDark] = useState(false);

  // Mock station list
  const [stations, setStations] = useState([
    { id: 1, name: "HP Petrol Pump", lat: 28.7041, lng: 77.1025, queue: 5, fuels: ["petrol", "diesel"], distance: 1.2 },
    { id: 2, name: "Indian Oil Station", lat: 28.7089, lng: 77.11, queue: 2, fuels: ["petrol", "cng"], distance: 2.5 },
    { id: 3, name: "Bharat Petroleum", lat: 28.7095, lng: 77.09, queue: 8, fuels: ["diesel", "cng"], distance: 3.1 },
  ]);

  // Reviews: in-memory local state { stationId: [ {name,text,ts}, ... ] }
  const [reviews, setReviews] = useState({});

  // Prices (mock)
  const [prices, setPrices] = useState(null);

  useEffect(() => {
    fetch("/mock-prices.json")
      .then((r) => r.json())
      .then((j) => setPrices(j))
      .catch((e) => console.error("Price fetch failed:", e));
  }, []);

  // Simulate live queue updates (for demo)
  useEffect(() => {
    const iv = setInterval(() => {
      setStations((prev) => prev.map((s) => ({ ...s, queue: Math.floor(Math.random() * 15) })));
    }, 5000);
    return () => clearInterval(iv);
  }, []);

  // Toggle dark class on <html> so Tailwind dark: styles apply everywhere (including outside component)
  useEffect(() => {
    const root = document.documentElement;
    if (dark) root.classList.add("dark");
    else root.classList.remove("dark");
  }, [dark]);

  // Filtering
  const filteredStations = fuelFilter === "all" ? stations : stations.filter((s) => s.fuels.includes(fuelFilter));

  // least crowded among filtered
  const leastCrowded = useMemo(() => {
    if (!filteredStations.length) return null;
    return filteredStations.reduce((min, s) => (s.queue < min.queue ? s : min), filteredStations[0]);
  }, [filteredStations]);

  // best choice (queue * distance)
  const bestChoice = useMemo(() => {
    if (!filteredStations.length) return null;
    return filteredStations.reduce((best, s) => {
      const score = s.queue * s.distance;
      const bestScore = best.queue * best.distance;
      return score < bestScore ? s : best;
    }, filteredStations[0]);
  }, [filteredStations]);

  // cheapest summary from prices
  const cheapest = useMemo(() => {
    if (!prices || !prices.prices) return null;
    const out = {};
    ["petrol", "diesel", "cng"].forEach((fuel) => {
      const cand = prices.prices.filter((p) => p[fuel] !== null && p[fuel] !== undefined);
      if (!cand.length) { out[fuel] = null; return; }
      cand.sort((a, b) => a[fuel] - b[fuel]);
      out[fuel] = { station: cand[0].station, price: cand[0][fuel] };
    });
    return out;
  }, [prices]);

  // Add a review
  const addReview = (stationId, name, text) => {
    setReviews((prev) => {
      const list = prev[stationId] ? [...prev[stationId]] : [];
      list.unshift({ name, text, ts: Date.now() });
      return { ...prev, [stationId]: list };
    });
  };

  // Report queue (prompt)
  const reportQueue = (stationId) => {
    const newQ = window.prompt("Enter number of cars in queue:");
    if (!newQ) return;
    setStations((prev) => prev.map((s) => (s.id === stationId ? { ...s, queue: parseInt(newQ) } : s)));
    alert("Queue updated");
  };

  // Map container style
  const containerStyle = { width: "100%", height: "58vh" };

  /* =========================
     Search bar (Places Autocomplete)
     ========================= */
  function SearchBar() {
    const { ready, value, suggestions: { status, data }, setValue, clearSuggestions } = usePlacesAutocomplete();

    const handleSelect = (description) => async () => {
      setValue(description, false);
      clearSuggestions();
      try {
        const results = await getGeocode({ address: description });
        const { lat, lng } = await getLatLng(results[0]);
        setMapCenter({ lat, lng });
      } catch (e) {
        console.error("Geocode failed", e);
      }
    };

    return (
      <div className="absolute top-20 left-1/2 transform -translate-x-1/2 w-11/12 md:w-1/2 z-20">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={!ready}
          placeholder="🔍 Search location..."
          className="w-full p-3 rounded-lg shadow border bg-white dark:bg-gray-800 dark:text-white"
        />
        {status === "OK" && (
          <ul className="bg-white dark:bg-gray-700 rounded shadow mt-2 max-h-44 overflow-y-auto">
            {data.map(({ place_id, description }) => (
              <li key={place_id} onClick={handleSelect(description)} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 cursor-pointer">
                {description}
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white">
      {/* header */}
      <header className="bg-blue-600 dark:bg-gray-800 text-white p-4 flex justify-between items-center">
        <h1 className="text-lg font-bold">⛽ Smart Fueling</h1>
          
      </header>

      {/* Best choice */}
      {bestChoice && (
        <div className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100 text-center py-2 font-medium">
          🚀 Best Choice: {bestChoice.name} — {bestChoice.distance} km, {bestChoice.queue} cars
        </div>
      )}

      {/* fuel filters */}
      <div className="flex justify-center gap-3 p-3 bg-white dark:bg-gray-800 sticky top-0 z-20">
        {[
          { key: "all", label: "🌐 All" },
          { key: "petrol", label: "⛽ Petrol" },
          { key: "diesel", label: "🚚 Diesel" },
          { key: "cng", label: "🌱 CNG" },
        ].map((btn) => (
          <button key={btn.key} onClick={() => setFuelFilter(btn.key)} className={`px-4 py-2 rounded ${fuelFilter === btn.key ? "bg-blue-600 text-white" : "bg-gray-200 dark:bg-gray-700 dark:text-white"}`}>
            {btn.label}
          </button>
        ))}
      </div>

      {/* Map */}
      <div className="relative">
        <LoadScript googleMapsApiKey="YOUR_GOOGLE_MAPS_API_KEY" libraries={["places"]}>
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={mapCenter}
            zoom={13}
            options={{
              styles: dark ? nightModeMapStyles : undefined,
              disableDefaultUI: false,
            }}
          >
            {filteredStations.map((s) => (
              <Marker
                key={s.id}
                position={{ lat: s.lat, lng: s.lng }}
                onClick={() => setSelected(s)}
                icon={{
                  url: leastCrowded && s.id === leastCrowded.id ? "http://maps.google.com/mapfiles/ms/icons/green-dot.png" : "http://maps.google.com/mapfiles/ms/icons/red-dot.png",
                }}
              />
            ))}

            {selected && (
              <InfoWindow position={{ lat: selected.lat, lng: selected.lng }} onCloseClick={() => setSelected(null)}>
                <div className="max-w-xs text-gray-900 dark:text-white">
                  <h3 className="font-bold">{selected.name}</h3>
                  <p>Queue: {selected.queue} cars</p>
                  <p>Fuels: {selected.fuels.join(", ")}</p>

                  <div className="flex gap-2 mt-2">
                    <button className="bg-blue-600 text-white px-3 py-1 rounded text-sm" onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${selected.lat},${selected.lng}`, "_blank")}>🧭 Navigate</button>
                    <button className="bg-yellow-500 text-white px-3 py-1 rounded text-sm" onClick={() => reportQueue(selected.id)}>📊 Report</button>
                  </div>

                  {/* Reviews */}
                  <div className="mt-3">
                    <div className="font-medium mb-1">Reviews</div>
                    <div className="max-h-28 overflow-y-auto space-y-2">
                      {reviews[selected.id] && reviews[selected.id].length ? (
                        reviews[selected.id].map((r, idx) => (
                          <div key={idx} className="bg-gray-50 dark:bg-gray-700 p-2 rounded text-sm">
                            <div className="font-semibold">{r.name}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-300">{new Date(r.ts).toLocaleString()}</div>
                            <div className="mt-1">{r.text}</div>
                          </div>
                        ))
                      ) : (
                        <div className="text-xs text-gray-500">No reviews yet</div>
                      )}
                    </div>

                    <ReviewForm stationId={selected.id} addReview={addReview} />
                  </div>
                </div>
              </InfoWindow>
            )}

            <SearchBar />
          </GoogleMap>
        </LoadScript>
      </div>

      {/* Price Comparison */}
      <section className="p-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">💰 Fuel Price Comparison</h2>
          <div className="text-sm text-gray-600 dark:text-gray-300">Updated: {prices?.updated_at ? new Date(prices.updated_at).toLocaleString() : "—"}</div>
        </div>

        {!prices ? (
          <p>Loading prices…</p>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {prices.prices.map((p, i) => (
                <div key={i} className="bg-white dark:bg-gray-800 p-4 rounded shadow flex justify-between">
                  <div>
                    <h3 className="font-semibold">{p.station}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-300">Distance: {p.distance_km} km</p>
                  </div>
                  <div className="text-right">
                    <div>Petrol: {p.petrol ? `₹${p.petrol}` : "—"}</div>
                    <div>Diesel: {p.diesel ? `₹${p.diesel}` : "—"}</div>
                    <div>CNG: {p.cng ? `₹${p.cng}` : "—"}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* cheapest */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
              <h4 className="font-semibold mb-2">Cheapest Prices</h4>
              <ul className="space-y-2">
                {["petrol", "diesel", "cng"].map((fuel) => {
                  const c = cheapest?.[fuel];
                  return (
                    <li key={fuel} className="flex items-center justify-between">
                      <span className="font-medium">{fuel.toUpperCase()}</span>
                      {c ? <span className="px-2 py-1 bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-100 rounded">{c.station} — ₹{c.price}</span> : <span className="text-gray-500">No data</span>}
                    </li>
                  );
                })}
              </ul>
            </div>
          </>
        )}
      </section>

      {/* recent reviews panel */}
      <aside className="fixed right-4 bottom-4 w-80 max-w-full z-30">
        <div className="bg-white dark:bg-gray-800 p-3 rounded shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="font-semibold">Recent Reviews</div>
            <div className="text-xs text-gray-500 dark:text-gray-300">Local</div>
          </div>
          <div className="max-h-48 overflow-y-auto space-y-2">
            {Object.keys(reviews).length === 0 ? <div className="text-sm text-gray-500">No reviews yet</div> : (
              Object.entries(reviews).flatMap(([sid, list]) => list.map((r, idx) => (
                <div key={`${sid}-${idx}`} className="bg-gray-50 dark:bg-gray-700 p-2 rounded">
                  <div className="text-sm font-semibold">{r.name} <span className="text-xs text-gray-500">({sid})</span></div>
                  <div className="text-xs text-gray-400">{new Date(r.ts).toLocaleString()}</div>
                  <div className="mt-1 text-sm">{r.text}</div>
                </div>
              )))
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}

