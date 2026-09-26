const fs = require("fs");
const path = require("path");
const config = require("../config");
const logger = require("./logger");

const defaultSeed = {
  workers: [
    {
      id: "W001",
      name: "Demo Worker",
      language: "English",
      role: "Worker",
      score: 82,
      risk: "Low",
      completed: 2,
      completedModules: ["M001", "M002"],
      scores: { M001: 85, M002: 80 },
      updatedAt: new Date().toISOString()
    },
    {
      id: "W002",
      name: "Rahul Verma",
      language: "Hindi",
      role: "Worker",
      score: 65,
      risk: "Medium",
      completed: 1,
      completedModules: ["M001"],
      scores: { M001: 65 },
      updatedAt: new Date().toISOString()
    }
  ],
  modules: [
    {
      id: "M001",
      title: "Mine Entrance Safety",
      sector: "Mining",
      zone: "MINE-ENTRANCE",
      duration: "10 min",
      hazard: "Unprotected entry, missing PPE, and unsafe approach to a mine entrance.",
      ppe: ["Helmet", "Safety shoes", "Reflective vest", "Eye protection"],
      steps: [
        "Wear all required PPE before entering the zone.",
        "Check the entrance for warning signs and restricted areas.",
        "Stay inside the marked safe path.",
        "Report any damaged barrier or unsafe condition."
      ],
      quiz: [
        {
          q: "What should you do before entering the mine zone?",
          options: ["Run inside", "Wear required PPE", "Remove helmet", "Ignore signs"],
          answer: 1
        },
        {
          q: "What should be reported immediately?",
          options: ["Damaged barriers", "Clean floor", "Your lunch", "A normal sign"],
          answer: 0
        }
      ]
    },
    {
      id: "M002",
      title: "Machine Station Safety",
      sector: "Manufacturing",
      zone: "PRESS-STATION",
      duration: "12 min",
      hazard: "Machine entanglement and unsafe operation near moving equipment.",
      ppe: ["Safety shoes", "Eye protection", "Gloves where permitted", "Hearing protection"],
      steps: [
        "Identify the machine emergency stop location.",
        "Keep loose clothing and hair away from moving parts.",
        "Never bypass a guard or safety interlock.",
        "Stop machine and report abnormal vibration or noise."
      ],
      quiz: [
        {
          q: "What must never be bypassed on a machine station?",
          options: ["Safety guard", "Lunch break", "Training screen", "Name badge"],
          answer: 0
        },
        {
          q: "What should happen if the machine behaves abnormally?",
          options: ["Ignore it", "Increase speed", "Stop and report", "Touch moving parts"],
          answer: 2
        }
      ]
    },
    {
      id: "M003",
      title: "Gas & Emergency Response",
      sector: "Mining",
      zone: "GAS-CHECK",
      duration: "8 min",
      hazard: "Possible hazardous gas exposure (CO/Methane) and delayed emergency response.",
      ppe: ["Helmet", "Gas detector", "Respiratory protection as required", "Safety shoes"],
      steps: [
        "Check the gas-monitoring indication before proceeding into the tunnel.",
        "If an audible or visual alarm occurs, move to the designated safe area immediately.",
        "Do not enter a suspected hazardous area without supervisor authorization.",
        "Raise an emergency report immediately."
      ],
      quiz: [
        {
          q: "What is the correct response to a gas alarm?",
          options: ["Move to safety immediately", "Hide the alarm", "Continue working", "Switch off all signs"],
          answer: 0
        },
        {
          q: "What should be raised after an unsafe event or gas detection?",
          options: ["Emergency report", "Social post", "Advertisement", "Nothing"],
          answer: 0
        }
      ]
    }
  ],
  incidents: [
    {
      id: "INC-DEMO-01",
      worker: "Demo Worker",
      type: "Hazard",
      location: "MINE-ENTRANCE",
      description: "Minor rock-fall warning barrier displaced near east tunnel entrance.",
      severity: "Medium",
      status: "Open",
      createdAt: new Date(Date.now() - 3600000).toISOString()
    }
  ]
};

class FileStorage {
  constructor(dataDir, dataFile) {
    this.dataDir = dataDir;
    this.dataFile = dataFile;
    this._writeLock = Promise.resolve();
    this.ensureInitialized();
  }

  ensureInitialized() {
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }
      if (!fs.existsSync(this.dataFile)) {
        this.writeAtomic(defaultSeed);
        logger.info("Database initialized with seed data", { dataFile: this.dataFile });
      } else {
        // Validate existing JSON
        try {
          const raw = fs.readFileSync(this.dataFile, "utf8");
          JSON.parse(raw);
        } catch (parseErr) {
          logger.error("Corrupted database detected. Creating backup and restoring seed.", {
            error: parseErr.message
          });
          const corruptBackup = `${this.dataFile}.corrupt.${Date.now()}`;
          fs.renameSync(this.dataFile, corruptBackup);
          this.writeAtomic(defaultSeed);
        }
      }
    } catch (err) {
      logger.error("Failed to initialize database storage", { error: err.message });
      throw err;
    }
  }

  read() {
    try {
      if (!fs.existsSync(this.dataFile)) {
        this.ensureInitialized();
      }
      const raw = fs.readFileSync(this.dataFile, "utf8");
      return JSON.parse(raw);
    } catch (err) {
      logger.error("Error reading database file", { error: err.message });
      return JSON.parse(JSON.stringify(defaultSeed));
    }
  }

  writeAtomic(data) {
    const tmpFile = path.join(
      this.dataDir,
      `db.tmp.${process.pid}.${Date.now()}.${Math.random().toString(36).slice(2, 8)}`
    );
    const content = JSON.stringify(data, null, 2);
    fs.writeFileSync(tmpFile, content, "utf8");
    fs.renameSync(tmpFile, this.dataFile);
  }

  async write(data) {
    // Sequential mutex queue to prevent race conditions during concurrent writes
    this._writeLock = this._writeLock.then(async () => {
      try {
        this.writeAtomic(data);
      } catch (err) {
        logger.error("Error in atomic file write", { error: err.message });
        throw err;
      }
    });
    return this._writeLock;
  }
}

const fileStorage = new FileStorage(config.dataDir, config.dataFile);

module.exports = {
  FileStorage,
  fileStorage,
  defaultSeed
};
