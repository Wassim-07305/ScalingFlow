const fs = require('fs');
const path = require('path');

const migrationsDir = path.join(__dirname, 'migrations');

// Step 0: Fix duplicate version numbers by renaming conflicting files
{
  const allFiles = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
  const seenVersions = new Map(); // version → first filename

  for (const file of allFiles) {
    const version = file.split('_')[0];
    if (seenVersions.has(version)) {
      // Rename this file: append 'b' to its version prefix
      const newName = file.replace(/^(\w+?)(_)/, (m, v, sep) => v + 'b' + sep);
      const oldPath = path.join(migrationsDir, file);
      const newPath = path.join(migrationsDir, newName);
      if (!fs.existsSync(newPath)) {
        fs.renameSync(oldPath, newPath);
        console.log(`🔄 Renamed: ${file} → ${newName}`);
      }
    } else {
      seenVersions.set(version, file);
    }
  }
}

const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql'));

for (const file of files) {
  const filePath = path.join(migrationsDir, file);
  const original = fs.readFileSync(filePath, 'utf8');
  let fixed = original;

  // 1. CREATE TABLE IF NOT EXISTS
  fixed = fixed.replace(
    /CREATE TABLE(?!\s+IF NOT EXISTS)\s+/gi,
    'CREATE TABLE IF NOT EXISTS '
  );

  // 2. CREATE INDEX IF NOT EXISTS (unique first to avoid double-match)
  fixed = fixed.replace(
    /CREATE UNIQUE INDEX(?!\s+IF NOT EXISTS)\s+/gi,
    'CREATE UNIQUE INDEX IF NOT EXISTS '
  );
  fixed = fixed.replace(
    /CREATE INDEX(?!\s+IF NOT EXISTS)\s+/gi,
    'CREATE INDEX IF NOT EXISTS '
  );

  // 3a. CREATE POLICY IF NOT EXISTS → remove IF NOT EXISTS (not supported in PG < 17)
  //     and prepend DROP POLICY IF EXISTS instead
  fixed = fixed.replace(
    /CREATE POLICY IF NOT EXISTS\s+("(?:[^"\\]|\\.)*"|\w+)\s+ON\s+(\S+)/gi,
    (match, policyName, tableName) => {
      const drop = `DROP POLICY IF EXISTS ${policyName} ON ${tableName};`;
      return `${drop}\nCREATE POLICY ${policyName} ON ${tableName}`;
    }
  );

  // 3b. CREATE POLICY (without IF NOT EXISTS) → prepend DROP POLICY IF EXISTS
  fixed = fixed.replace(
    /CREATE POLICY\s+("(?:[^"\\]|\\.)*"|\w+)\s+ON\s+(\S+)/gi,
    (match, policyName, tableName) => {
      const drop = `DROP POLICY IF EXISTS ${policyName} ON ${tableName};`;
      return `${drop}\nCREATE POLICY ${policyName} ON ${tableName}`;
    }
  );

  // Remove duplicate consecutive DROP POLICY lines
  fixed = fixed.replace(
    /(DROP POLICY IF EXISTS [^\n]+;\n)\1+/g,
    '$1'
  );

  // 4. CREATE TRIGGER → prepend DROP TRIGGER IF EXISTS (only if not already there)
  fixed = fixed.replace(
    /CREATE TRIGGER\s+(\w+)\s+(BEFORE|AFTER|INSTEAD\s+OF)\s+[^\n]+\s+ON\s+(\S+)/gi,
    (match, triggerName, timing, tableName) => {
      const cleanTable = tableName.replace(/\s.*/, '');
      const dropLine = `DROP TRIGGER IF EXISTS ${triggerName} ON ${cleanTable};`;
      return `${dropLine}\n${match}`;
    }
  );
  // Remove duplicate consecutive DROP TRIGGER lines
  fixed = fixed.replace(
    /(DROP TRIGGER IF EXISTS [^\n]+;\n)\1+/g,
    '$1'
  );

  // 5. ADD CONSTRAINT ... CHECK → add NOT VALID to skip existing row validation
  fixed = fixed.replace(
    /ADD CONSTRAINT\s+\w+\s+CHECK[\s\S]*?;(\r?\n|$)/gi,
    (match) => {
      if (/NOT VALID/i.test(match)) return match;
      return match.replace(/\)\s*;(\r?\n|$)/, ') NOT VALID;$1');
    }
  );

  // 6. INSERT INTO ... VALUES → add ON CONFLICT DO NOTHING if missing
  fixed = fixed.replace(
    /(INSERT\s+INTO\s+[\s\S]*?\))\s*(;)/gi,
    (match, insertPart, semi) => {
      if (/ON\s+CONFLICT/i.test(insertPart)) return match;
      return `${insertPart}\nON CONFLICT DO NOTHING${semi}`;
    }
  );

  if (fixed !== original) {
    fs.writeFileSync(filePath, fixed, 'utf8');
    console.log(`✔ Patched: ${file}`);
  } else {
    console.log(`✓ Already OK: ${file}`);
  }
}
