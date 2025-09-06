import React, { useState } from "react";

export default function SmartFuelingSystem() {
  const [search, setSearch] = useState("");

  // Dummy station data (replace later with backend/API)
  const stations = [
    {
      id: 1,
      name: "HP Petrol Pump",
      lat: 28.7041,
      lng: 77.1025,
      petrol: true,
      diesel: true,
      cng: false,
      price: { petrol: 97, diesel: 90, cng: "-" },
      queue: "5 cars",
    },
    {
      id: 2,
      name: "Indian Oil Station",
      lat: 28.7089,
      lng: 77.11,
      petrol: true,
      diesel: false,
      cng: true,
      price: { petrol: 96, diesel: "-", cng: 75 },
      queue: "2 cars",
    },
  ];

  // ✅ Fixed Google Maps URL generator
  const navigateTo = (lat, lng) => {
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
      "_blank"
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900">
      {/* Header */}
      <header className="bg-blue-600 text-white p-4 shadow-lg">
        <h1 className="text-2xl font-bold">⛽ Smart Fueling System</h1>
        <p className="text-sm">Find stations | Check availability | Save time</p>
      </header>

      {/* Search Bar */}
      <div className="flex justify-center mt-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search location..."
          className="w-2/3 md:w-1/2 p-3 rounded-lg border shadow"
        />
        <button className="ml-2 px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700">
          Search
        </button>
      </div>

      {/* Google Map Embed */}
      <div className="flex justify-center mt-6">
        <iframe
          title="map"
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d224345.83926188247!2d77.06889995!3d28.5272803!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390cfd3f9a05f6fb%3A0x80fdd7e97a76a7b7!2sNew%20Delhi%2C%20Delhi!5e0!3m2!1sen!2sin!4v1694270043564!5m2!1sen!2sin"
          width="90%"
          height="350"
          className="rounded-xl shadow-lg"
          allowFullScreen=""
          loading="lazy"
        ></iframe>
      </div>

      {/* Station Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
        {stations.map((station) => (
          <div
            key={station.id}
            className="bg-white rounded-xl shadow-lg p-5 flex flex-col justify-between"
          >
            <h2 className="text-xl font-bold mb-2">{station.name}</h2>
            <p className="text-sm text-gray-600 mb-2">Queue: {station.queue}</p>
            <div className="flex gap-3 text-sm mb-3">
              <span
                className={`px-2 py-1 rounded ${
                  station.petrol ? "bg-green-200" : "bg-red-200"
                }`}
              >
                Petrol: {station.price.petrol}
              </span>
              <span
                className={`px-2 py-1 rounded ${
                  station.diesel ? "bg-green-200" : "bg-red-200"
                }`}
              >
                Diesel: {station.price.diesel}
              </span>
              <span
                className={`px-2 py-1 rounded ${
                  station.cng ? "bg-green-200" : "bg-red-200"
                }`}
              >
                CNG: {station.price.cng}
              </span>
            </div>
            <button
              onClick={() => navigateTo(station.lat, station.lng)}
              className="mt-auto bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700"
            >
              Navigate
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}