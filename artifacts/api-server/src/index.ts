import app from "./app";

const port = Number(process.env["PORT"] || "5000");

app.listen(port, "0.0.0.0", () => {
  console.log(`[SERVER] 50-30-20 Finanzas running on http://0.0.0.0:${port}`);
});

