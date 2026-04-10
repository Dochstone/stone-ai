"use client";

import { useState } from "react";

export default function TestAvatarPage() {
  const [result, setResult] = useState("Ожидание...");
  const [preview, setPreview] = useState<string | null>(null);

  return (
    <div style={{ padding: 40, fontFamily: "sans-serif" }}>
      <h1>Тест file input</h1>

      <h2>Тест 1: простой input</h2>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          setResult(file ? `onChange: ${file.name} (${file.size} bytes)` : "onChange: нет файла");
          if (file) {
            const reader = new FileReader();
            reader.onload = () => setPreview(reader.result as string);
            reader.readAsDataURL(file);
          }
        }}
      />

      <h2>Тест 2: label + hidden input</h2>
      <input
        id="test-file"
        type="file"
        accept="image/*"
        style={{ position: "absolute", width: 0, height: 0, opacity: 0 }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          setResult(file ? `label onChange: ${file.name} (${file.size} bytes)` : "label onChange: нет файла");
          if (file) {
            const reader = new FileReader();
            reader.onload = () => setPreview(reader.result as string);
            reader.readAsDataURL(file);
          }
        }}
      />
      <label htmlFor="test-file" style={{ padding: "10px 20px", background: "#6366f1", color: "#fff", borderRadius: 8, cursor: "pointer" }}>
        Выбрать через label
      </label>

      <h2>Результат</h2>
      <p style={{ color: result.includes("bytes") ? "green" : "red", fontSize: 18 }}>{result}</p>

      {preview && (
        <img src={preview} alt="Preview" style={{ width: 128, height: 128, borderRadius: "50%", objectFit: "cover", marginTop: 10 }} />
      )}
    </div>
  );
}
