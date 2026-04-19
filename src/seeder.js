const seedAccounts = () => {
  const accounts = [
    {
      id: 1,
      name: "Meljean B. Bello",
      username: "meljeanb",
      password: "meljean123",
    },
    {
      id: 2,
      name: "Kristel Miñoza Relatorres",
      username: "kristelm",
      password: "kristel123",
    },
    {
      id: 3,
      name: "Yuri D. Briones",
      username: "yurid",
      password: "yuri123",
    },
    {
      id: 4,
      name: "Angel O. Geverola",
      username: "angelo",
      password: "angel123",
    },
    {
      id: 5,
      name: "Mikko V. Asoque",
      username: "mikkova",
      password: "mikko123",
    },
    {
      id: 6,
      name: "Maychel A. Sardido",
      username: "maychela",
      password: "maychel123",
    },
    {
      id: 7,
      name: "Alwin M. Olave",
      username: "alwinm",
      password: "alwin123",
    },
    {
      id: 8,
      name: "Roan Mae L. Alfante",
      username: "roanmael",
      password: "roanmae123",
    },
    {
      id: 9,
      name: "Yvonne Grace C. Asoy",
      username: "yvonnegrace",
      password: "yvonne123",
    },
    {
      id: 10,
      name: "Hazel C. Navarro",
      username: "hazelc",
      password: "hazel123",
    },
    {
      id: 11,
      name: "Ivy Jean P. Navarro",
      username: "ivyjean",
      password: "ivyjean123",
    },
    {
      id: 12,
      name: "Sam Miano",
      username: "samm",
      password: "sam123",
    },
    {
      id: 13,
      name: "Judel C. Bagisan",
      username: "judelc",
      password: "judel123",
    },
    {
      id: 14,
      name: "Glydel Joy Despojo",
      username: "glydeljoy",
      password: "glydel123",
    },
    {
      id: 15,
      name: "Ranny Sato",
      username: "rannys",
      password: "ranny123",
    },
    {
      id: 16,
      name: "Lea Mae T. Pamaylaon",
      username: "leamaet",
      password: "leamae123",
    },
    {
      id: 17,
      name: "Carlos Jyed V. Quiñones",
      username: "carlosjyed",
      password: "carlos123",
    },
    {
      id: 18,
      name: "Ferdinand L. Yu Jr.",
      username: "ferdinandl",
      password: "ferdinand123",
    },
    {
      id: 19,
      name: "Claribel Compahinay",
      username: "claribel",
      password: "claribel123",
    },
    {
      id: 20,
      name: "Joy Ferraren",
      username: "joyf",
      password: "joy123",
    },
    {
      id: 21,
      name: "Uriel Edar",
      username: "uriele",
      password: "uriel123",
    },
    {
      id: 22,
      name: "Trishia Gimarino",
      username: "trishiag",
      password: "trishia123",
    },
  ];

  // Always overwrite to ensure latest accounts are seeded
  localStorage.setItem("mqs_accounts", JSON.stringify(accounts));
  console.log("✅ Accounts seeded successfully!");
};

export default seedAccounts;