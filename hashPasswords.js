import bcrypt from 'bcryptjs';

const passwords = [
  { user: 'admin', password: 'admin123' },
  { user: 'agent1', password: 'agent123' },
  { user: 'agent2', password: 'agent123' },
  { user: 'voter1', password: 'voter123' },
  { user: 'voter2', password: 'voter123' },
  { user: 'voter3', password: 'voter123' },
];

passwords.forEach(async (p) => {
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(p.password, salt);
  console.log(`${p.user}: ${hash}`);
});
