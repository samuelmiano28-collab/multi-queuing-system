const seedAccounts = () => {
  const accounts = [
    {
      id: 1,
      name: "Admin User",
      username: "adminuser",
      password: "admin123",
    },
    {
      id: 2,
      name: "Staff One",
      username: "staffone",
      password: "staff123",
    },
    {
      id: 3,
      name: "Samuel Dev",
      username: "samueldev",
      password: "samuel123",
    },
  ];

  if (!localStorage.getItem("mqs_accounts")) {
    localStorage.setItem("mqs_accounts", JSON.stringify(accounts));
    console.log("✅ Sample accounts seeded successfully!");
  } else {
    console.log("ℹ️ Accounts already seeded.");
  }
};

export default seedAccounts;