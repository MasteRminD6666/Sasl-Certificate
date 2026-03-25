"use client";
import React, { useState } from "react";

const PushNotificationForm = () => {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [data, setData] = useState("{}");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState("");

  const sendNotification = async () => {
    if (!title || !message) {
      alert("Please fill in all fields.");
      return;
    }

    let parsedData;
    try {
      parsedData = JSON.parse(data);
    } catch (error) {
      alert("Invalid JSON format in the Data field.");
      return;
    }

    setLoading(true);
    setResponse("");

    try {
      const res = await fetch("/api/send-push-notification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title, message, data: parsedData }),
      });

      const responseData = await res.json();
      if (res.ok) {
        setResponse("✅ Notification sent successfully!");
      } else {
        setResponse(`❌ Error: ${responseData.error}`);
      }
    } catch (error) {
      setResponse("❌ Failed to send notification.");
    }

    setLoading(false);
  };

  return (
    <div className="flex justify-center items-center min-h-screen p-4">
      <div className="w-full max-w-lg bg-gray-900 shadow-lg rounded-xl p-6">
        <h2 className="text-2xl font-bold text-white mb-4">
          Send Batch Push Notification
        </h2>

        <div className="mb-4">
          <label className="block text-gray-100 font-medium mb-1">Title</label>
          <input
            type="text"
            className="w-full p-3 bg-gray-800 border border-gray-300 rounded-md outline-none"
            placeholder="Enter notification title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-100 font-medium mb-1">
            Message
          </label>
          <textarea
            className="w-full p-3 bg-gray-800 border border-gray-300 rounded-md outline-none"
            placeholder="Enter notification message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          ></textarea>
        </div>

        <div className="mb-4">
          <label className="block text-gray-100 font-medium mb-1">
            Data (JSON)
          </label>
          <textarea
            className="w-full p-3 border bg-gray-800 border-gray-300 rounded-md outline-none"
            placeholder='{"url": "https://yourapp.com/some-page"}'
            value={data}
            onChange={(e) => setData(e.target.value)}
          ></textarea>
          <p className="text-gray-400 text-sm mt-1">
            Add custom data like redirect links in JSON format.
          </p>
        </div>

        <button
          onClick={sendNotification}
          disabled={loading}
          className={`w-full p-3 text-white font-medium rounded-md transition ${
            loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {loading ? "Sending..." : "Send Notification"}
        </button>

        {response && (
          <p className="mt-4 text-center text-sm text-gray-300">{response}</p>
        )}
      </div>
    </div>
  );
};

export default PushNotificationForm;
