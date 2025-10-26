import bcrypt from 'bcryptjs';

const users = [
  'Alice',      // admin
  'Bob',        // observer
  'Charlie',    // candidate
  'Diana',      // BLO
  'Edward',     // super_agent
  'Fiona',      // agent
  'George',     // voter
  'Hannah',     // voter
  'Ian',        // candidate
  'Julia'       // admin
];

const plainPassword = '123456';

async function generateHashes() {
  for (const user of users) {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(plainPassword, salt);
    console.log(`${user}: '${hash}'`);
  }
}

generateHashes();
