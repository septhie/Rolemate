function devLog(label, payload) {
  if (process.env.NODE_ENV === "development") {
    console.log(`[Rolemate] ${label}`, JSON.stringify(payload, null, 2));
  }
}

function createRunContext() {
  return {
    startedAt: Date.now(),
    apiCallsMade: 0,
    usage: [],
    retriesTriggered: 0
  };
}

module.exports = {
  devLog,
  createRunContext
};

