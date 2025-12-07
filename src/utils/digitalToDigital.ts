import { DataPoint, DigitalToDigitalAlgorithm } from '../types';

export function generateDigitalToDigitalSignal(
  binaryInput: string,
  algorithm: DigitalToDigitalAlgorithm
): { input: DataPoint[]; transmitted: DataPoint[]; output: DataPoint[] } {
  const bits = binaryInput.split('').map(b => parseInt(b));
  const bitDuration = 1;

  const inputSignal: DataPoint[] = [];
  for (let i = 0; i < bits.length; i++) {
    inputSignal.push({ x: i * bitDuration, y: bits[i] });
    inputSignal.push({ x: (i + 1) * bitDuration, y: bits[i] });
  }

  let transmittedSignal: DataPoint[] = [];

  switch (algorithm) {
    case 'NRZ-L':
      transmittedSignal = generateNRZL(bits, bitDuration);
      break;
    case 'NRZ-I':
      transmittedSignal = generateNRZI(bits, bitDuration);
      break;
    case 'Manchester':
      transmittedSignal = generateManchester(bits, bitDuration);
      break;
    case 'Differential Manchester':
      transmittedSignal = generateDifferentialManchester(bits, bitDuration);
      break;
    case 'AMI':
      transmittedSignal = generateAMI(bits, bitDuration);
      break;
    case 'Pseudoternary':
      transmittedSignal = generatePseudoternary(bits, bitDuration);
      break;
    case 'B8ZS':
      transmittedSignal = generateB8ZS(bits, bitDuration);
      break;
    case 'HDB3':
      transmittedSignal = generateHDB3(bits, bitDuration);
      break;
  }

  return {
    input: inputSignal,
    transmitted: transmittedSignal,
    output: inputSignal,
  };
}

// NRZ-L: 0 = high level (+1), 1 = low level (-1)
function generateNRZL(bits: number[], bitDuration: number): DataPoint[] {
  const signal: DataPoint[] = [];
  for (let i = 0; i < bits.length; i++) {
    const voltage = bits[i] === 0 ? 1 : -1;
    signal.push({ x: i * bitDuration, y: voltage });
    signal.push({ x: (i + 1) * bitDuration, y: voltage });
  }
  return signal;
}

// NRZ-I: 0 = no transition, 1 = transition at beginning
function generateNRZI(bits: number[], bitDuration: number): DataPoint[] {
  const signal: DataPoint[] = [];
  let currentLevel = 1;

  for (let i = 0; i < bits.length; i++) {
    if (bits[i] === 1) {
      currentLevel = currentLevel === 1 ? -1 : 1;
    }
    signal.push({ x: i * bitDuration, y: currentLevel });
    signal.push({ x: (i + 1) * bitDuration, y: currentLevel });
  }
  return signal;
}

// Manchester: 0 = high to low transition, 1 = low to high transition
function generateManchester(bits: number[], bitDuration: number): DataPoint[] {
  const signal: DataPoint[] = [];
  for (let i = 0; i < bits.length; i++) {
    if (bits[i] === 0) {
      // High to low
      signal.push({ x: i * bitDuration, y: 1 });
      signal.push({ x: (i + 0.5) * bitDuration, y: 1 });
      signal.push({ x: (i + 0.5) * bitDuration, y: -1 });
      signal.push({ x: (i + 1) * bitDuration, y: -1 });
    } else {
      // Low to high
      signal.push({ x: i * bitDuration, y: -1 });
      signal.push({ x: (i + 0.5) * bitDuration, y: -1 });
      signal.push({ x: (i + 0.5) * bitDuration, y: 1 });
      signal.push({ x: (i + 1) * bitDuration, y: 1 });
    }
  }
  return signal;
}

// Differential Manchester: always transition in middle, 0 = transition at beginning, 1 = no transition at beginning
function generateDifferentialManchester(bits: number[], bitDuration: number): DataPoint[] {
  const signal: DataPoint[] = [];
  let currentLevel = 1;

  for (let i = 0; i < bits.length; i++) {
    // For 0: transition at beginning
    if (bits[i] === 0) {
      currentLevel = currentLevel === 1 ? -1 : 1;
    }
    // For 1: no transition at beginning
    
    // First half of bit period
    signal.push({ x: i * bitDuration, y: currentLevel });
    signal.push({ x: (i + 0.5) * bitDuration, y: currentLevel });
    
    // Always transition in middle
    currentLevel = currentLevel === 1 ? -1 : 1;
    
    // Second half of bit period
    signal.push({ x: (i + 0.5) * bitDuration, y: currentLevel });
    signal.push({ x: (i + 1) * bitDuration, y: currentLevel });
  }
  return signal;
}

// Bipolar AMI: 0 = no signal (0), 1 = alternating +1/-1
function generateAMI(bits: number[], bitDuration: number): DataPoint[] {
  const signal: DataPoint[] = [];
  let lastOnePolarity = -1;

  for (let i = 0; i < bits.length; i++) {
    let voltage = 0;
    if (bits[i] === 1) {
      lastOnePolarity = lastOnePolarity === 1 ? -1 : 1;
      voltage = lastOnePolarity;
    }
    signal.push({ x: i * bitDuration, y: voltage });
    signal.push({ x: (i + 1) * bitDuration, y: voltage });
  }
  return signal;
}

// Pseudoternary: 0 = alternating +1/-1, 1 = no signal (0)
function generatePseudoternary(bits: number[], bitDuration: number): DataPoint[] {
  const signal: DataPoint[] = [];
  let lastZeroPolarity = -1;

  for (let i = 0; i < bits.length; i++) {
    let voltage = 0;
    if (bits[i] === 0) {
      lastZeroPolarity = lastZeroPolarity === 1 ? -1 : 1;
      voltage = lastZeroPolarity;
    }
    signal.push({ x: i * bitDuration, y: voltage });
    signal.push({ x: (i + 1) * bitDuration, y: voltage });
  }
  return signal;
}

// B8ZS: Same as AMI, but string of 8 zeros replaced with pattern containing violations
function generateB8ZS(bits: number[], bitDuration: number): DataPoint[] {
  const signal: DataPoint[] = [];
  let lastOnePolarity = -1;

  for (let i = 0; i < bits.length; i++) {
    // Check for 8 consecutive zeros
    if (i + 7 < bits.length && bits.slice(i, i + 8).every(b => b === 0)) {
      // Replace with B8ZS substitution pattern: 000VB0VB
      // V = violation (same polarity as last), B = bipolar (opposite polarity)
      const V = lastOnePolarity;
      const B = lastOnePolarity === 1 ? -1 : 1;
      
      // 000VB0VB pattern
      const pattern = [0, 0, 0, V, B, 0, V, B];
      for (let j = 0; j < 8; j++) {
        signal.push({ x: (i + j) * bitDuration, y: pattern[j] });
        signal.push({ x: (i + j + 1) * bitDuration, y: pattern[j] });
      }
      
      lastOnePolarity = B;
      i += 7; // Skip the next 7 bits (loop increment will add 1)
    } else {
      // Normal AMI encoding
      let voltage = 0;
      if (bits[i] === 1) {
        lastOnePolarity = lastOnePolarity === 1 ? -1 : 1;
        voltage = lastOnePolarity;
      }
      signal.push({ x: i * bitDuration, y: voltage });
      signal.push({ x: (i + 1) * bitDuration, y: voltage });
    }
  }
  return signal;
}

// HDB3: Same as AMI, but string of 4 zeros replaced with pattern containing violation
function generateHDB3(bits: number[], bitDuration: number): DataPoint[] {
  const signal: DataPoint[] = [];
  let lastOnePolarity = -1;
  let onesCount = 0; // Count of ones since last substitution

  for (let i = 0; i < bits.length; i++) {
    // Check for 4 consecutive zeros
    if (i + 3 < bits.length && bits.slice(i, i + 4).every(b => b === 0)) {
      // Determine substitution pattern based on ones count
      let pattern: number[];
      
      if (onesCount % 2 === 0) {
        // Even number of ones: use 000V (violation)
        const V = lastOnePolarity;
        pattern = [0, 0, 0, V];
        lastOnePolarity = V;
      } else {
        // Odd number of ones: use B00V (balance + violation)
        const B = lastOnePolarity === 1 ? -1 : 1;
        const V = B;
        pattern = [B, 0, 0, V];
        lastOnePolarity = V;
      }
      
      for (let j = 0; j < 4; j++) {
        signal.push({ x: (i + j) * bitDuration, y: pattern[j] });
        signal.push({ x: (i + j + 1) * bitDuration, y: pattern[j] });
      }
      
      onesCount = 0;
      i += 3; // Skip the next 3 bits (loop increment will add 1)
    } else {
      // Normal AMI encoding
      let voltage = 0;
      if (bits[i] === 1) {
        lastOnePolarity = lastOnePolarity === 1 ? -1 : 1;
        voltage = lastOnePolarity;
        onesCount++;
      }
      signal.push({ x: i * bitDuration, y: voltage });
      signal.push({ x: (i + 1) * bitDuration, y: voltage });
    }
  }
  return signal;
}
