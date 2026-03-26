const app = require("./app");

const PORT = Number(process.env.PORT || 4000);

app.listen(PORT, () => {
  console.log(`Rolemate API listening on http://localhost:${PORT}`);
});

