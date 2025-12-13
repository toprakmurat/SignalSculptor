import { DataPoint, DigitalToDigitalAlgorithm } from '../types';
import { VIEWPORT_BUFFER_SIZE } from '../constants';

/**
 * Generates digital-to-digital encoding signal data.
 * 
 * @param binaryInput - Binary string (0s and 1s)
 * @param algorithm - Encoding algorithm to use
 * @param startBit - Optional start bit index for partial generation (0-based)
 * @param endBit - Optional end bit index for partial generation (exclusive)
 * @returns Object containing input, transmitted, and output signal data
 * @throws Error if binary input is invalid
 */
export function generateDigitalToDigitalSignal(
  binaryInput: string,
  algorithm: DigitalToDigitalAlgorithm,
  startBit?: number,
  endBit?: number
): { input: DataPoint[]; transmitted: DataPoint[]; output: DataPoint[] } {
  // Validate input
  if (!/^[01]+$/.test(binaryInput)) {
    throw new Error('Invalid binary input: must contain only 0s and 1s');
  }
  if (binaryInput.length === 0) {
    throw new Error('Binary input cannot be empty');
  }
  
  // Convert string to number array (optimized: pre-allocate)
  const allBits: number[] = new Array(binaryInput.length);
  for (let i = 0; i < binaryInput.length; i++) {
    allBits[i] = parseInt(binaryInput[i], 10);
  }
  
  const bitDuration = 1;
  const totalBits = allBits.length;
  
  // Handle partial generation for viewport
  const usePartial = startBit !== undefined && endBit !== undefined;
  const actualStartBit = usePartial ? Math.max(0, startBit - VIEWPORT_BUFFER_SIZE) : 0;
  const actualEndBit = usePartial ? Math.min(totalBits, endBit + VIEWPORT_BUFFER_SIZE) : totalBits;
  const numBits = actualEndBit - actualStartBit;
  
  // Extract relevant bits for partial generation
  const bits = usePartial 
    ? allBits.slice(actualStartBit, actualEndBit)
    : allBits;

  // Pre-allocate input signal array (2 points per bit)
  // Adjust x coordinates for partial generation
  const inputSignal: DataPoint[] = new Array(numBits * 2);
  for (let i = 0; i < numBits; i++) {
    const bitValue = bits[i];
    const x1 = (actualStartBit + i) * bitDuration;
    const x2 = (actualStartBit + i + 1) * bitDuration;
    inputSignal[i * 2] = { x: x1, y: bitValue };
    inputSignal[i * 2 + 1] = { x: x2, y: bitValue };
  }

  let transmittedSignal: DataPoint[] = [];

  // For algorithms that need context (B8ZS, HDB3, NRZ-I, Differential Manchester, AMI, Pseudoternary),
  // we need to pass the full bit sequence and the start offset
  switch (algorithm) {
    case 'NRZ-L':
      transmittedSignal = generateNRZL(bits, bitDuration, actualStartBit);
      break;
    case 'NRZ-I':
      transmittedSignal = generateNRZI(allBits, bitDuration, actualStartBit, actualEndBit);
      break;
    case 'Manchester':
      transmittedSignal = generateManchester(bits, bitDuration, actualStartBit);
      break;
    case 'Differential Manchester':
      transmittedSignal = generateDifferentialManchester(allBits, bitDuration, actualStartBit, actualEndBit);
      break;
    case 'AMI':
      transmittedSignal = generateAMI(allBits, bitDuration, actualStartBit, actualEndBit);
      break;
    case 'Pseudoternary':
      transmittedSignal = generatePseudoternary(allBits, bitDuration, actualStartBit, actualEndBit);
      break;
    case 'B8ZS':
      transmittedSignal = generateB8ZS(allBits, bitDuration, actualStartBit, actualEndBit);
      break;
    case 'HDB3':
      transmittedSignal = generateHDB3(allBits, bitDuration, actualStartBit, actualEndBit);
      break;
    default:
      throw new Error(`Unknown algorithm: ${algorithm}`);
  }

  return {
    input: inputSignal,
    transmitted: transmittedSignal,
    output: inputSignal,
  };
}

/**
 * NRZ-L (Non-Return-to-Zero Level): 0 = high level (+1), 1 = low level (-1)
 */
function generateNRZL(bits: number[], bitDuration: number, startBit: number = 0): DataPoint[] {
  const signal: DataPoint[] = new Array(bits.length * 2);
  for (let i = 0; i < bits.length; i++) {
    const voltage = bits[i] === 0 ? 1 : -1;
    const x1 = (startBit + i) * bitDuration;
    const x2 = (startBit + i + 1) * bitDuration;
    signal[i * 2] = { x: x1, y: voltage };
    signal[i * 2 + 1] = { x: x2, y: voltage };
  }
  return signal;
}

/**
 * NRZ-I (Non-Return-to-Zero Inverted): 0 = no transition, 1 = transition at beginning
 * Needs full context to determine initial level
 */
function generateNRZI(allBits: number[], bitDuration: number, startBit: number, endBit: number): DataPoint[] {
  const bits = allBits.slice(startBit, endBit);
  const signal: DataPoint[] = new Array(bits.length * 2);
  
  // Determine initial level by processing bits before startBit
  let currentLevel = 1;
  for (let i = 0; i < startBit; i++) {
    if (allBits[i] === 1) {
      currentLevel = currentLevel === 1 ? -1 : 1;
    }
  }

  for (let i = 0; i < bits.length; i++) {
    if (bits[i] === 1) {
      currentLevel = currentLevel === 1 ? -1 : 1;
    }
    const x1 = (startBit + i) * bitDuration;
    const x2 = (startBit + i + 1) * bitDuration;
    signal[i * 2] = { x: x1, y: currentLevel };
    signal[i * 2 + 1] = { x: x2, y: currentLevel };
  }
  return signal;
}

/**
 * Manchester: 0 = high to low transition, 1 = low to high transition
 */
function generateManchester(bits: number[], bitDuration: number, startBit: number = 0): DataPoint[] {
  const signal: DataPoint[] = new Array(bits.length * 4);
  for (let i = 0; i < bits.length; i++) {
    const baseX = (startBit + i) * bitDuration;
    const midX = (startBit + i + 0.5) * bitDuration;
    const endX = (startBit + i + 1) * bitDuration;
    const baseIndex = i * 4;
    
    if (bits[i] === 0) {
      // High to low
      signal[baseIndex] = { x: baseX, y: 1 };
      signal[baseIndex + 1] = { x: midX, y: 1 };
      signal[baseIndex + 2] = { x: midX, y: -1 };
      signal[baseIndex + 3] = { x: endX, y: -1 };
    } else {
      // Low to high
      signal[baseIndex] = { x: baseX, y: -1 };
      signal[baseIndex + 1] = { x: midX, y: -1 };
      signal[baseIndex + 2] = { x: midX, y: 1 };
      signal[baseIndex + 3] = { x: endX, y: 1 };
    }
  }
  return signal;
}

/**
 * Differential Manchester: always transition in middle, 
 * 0 = transition at beginning, 1 = no transition at beginning
 * Needs full context to determine initial level
 */
function generateDifferentialManchester(allBits: number[], bitDuration: number, startBit: number, endBit: number): DataPoint[] {
  const bits = allBits.slice(startBit, endBit);
  const signal: DataPoint[] = new Array(bits.length * 4);
  
  // Determine initial level by processing bits before startBit
  let currentLevel = 1;
  for (let i = 0; i < startBit; i++) {
    if (allBits[i] === 0) {
      currentLevel = currentLevel === 1 ? -1 : 1;
    }
    // Always transition in middle (for each bit)
    currentLevel = currentLevel === 1 ? -1 : 1;
  }

  for (let i = 0; i < bits.length; i++) {
    // For 0: transition at beginning
    if (bits[i] === 0) {
      currentLevel = currentLevel === 1 ? -1 : 1;
    }
    // For 1: no transition at beginning
    
    const baseX = (startBit + i) * bitDuration;
    const midX = (startBit + i + 0.5) * bitDuration;
    const endX = (startBit + i + 1) * bitDuration;
    const baseIndex = i * 4;
    
    // First half of bit period
    signal[baseIndex] = { x: baseX, y: currentLevel };
    signal[baseIndex + 1] = { x: midX, y: currentLevel };
    
    // Always transition in middle
    currentLevel = currentLevel === 1 ? -1 : 1;
    
    // Second half of bit period
    signal[baseIndex + 2] = { x: midX, y: currentLevel };
    signal[baseIndex + 3] = { x: endX, y: currentLevel };
  }
  return signal;
}

/**
 * Bipolar AMI (Alternate Mark Inversion): 0 = no signal (0), 1 = alternating +1/-1
 * Needs full context to determine polarity state
 */
function generateAMI(allBits: number[], bitDuration: number, startBit: number, endBit: number): DataPoint[] {
  const bits = allBits.slice(startBit, endBit);
  const signal: DataPoint[] = new Array(bits.length * 2);
  
  // Determine initial polarity by processing bits before startBit
  let lastOnePolarity = -1;
  for (let i = 0; i < startBit; i++) {
    if (allBits[i] === 1) {
      lastOnePolarity = lastOnePolarity === 1 ? -1 : 1;
    }
  }

  for (let i = 0; i < bits.length; i++) {
    let voltage = 0;
    if (bits[i] === 1) {
      lastOnePolarity = lastOnePolarity === 1 ? -1 : 1;
      voltage = lastOnePolarity;
    }
    const x1 = (startBit + i) * bitDuration;
    const x2 = (startBit + i + 1) * bitDuration;
    signal[i * 2] = { x: x1, y: voltage };
    signal[i * 2 + 1] = { x: x2, y: voltage };
  }
  return signal;
}

/**
 * Pseudoternary: 0 = alternating +1/-1, 1 = no signal (0)
 * Needs full context to determine polarity state
 */
function generatePseudoternary(allBits: number[], bitDuration: number, startBit: number, endBit: number): DataPoint[] {
  const bits = allBits.slice(startBit, endBit);
  const signal: DataPoint[] = new Array(bits.length * 2);
  
  // Determine initial polarity by processing bits before startBit
  let lastZeroPolarity = -1;
  for (let i = 0; i < startBit; i++) {
    if (allBits[i] === 0) {
      lastZeroPolarity = lastZeroPolarity === 1 ? -1 : 1;
    }
  }

  for (let i = 0; i < bits.length; i++) {
    let voltage = 0;
    if (bits[i] === 0) {
      lastZeroPolarity = lastZeroPolarity === 1 ? -1 : 1;
      voltage = lastZeroPolarity;
    }
    const x1 = (startBit + i) * bitDuration;
    const x2 = (startBit + i + 1) * bitDuration;
    signal[i * 2] = { x: x1, y: voltage };
    signal[i * 2 + 1] = { x: x2, y: voltage };
  }
  return signal;
}

/**
 * B8ZS (Bipolar 8-Zero Substitution): Same as AMI, but string of 8 zeros 
 * replaced with pattern containing violations.
 * Needs full context to determine polarity and detect patterns.
 */
function generateB8ZS(allBits: number[], bitDuration: number, startBit: number, endBit: number): DataPoint[] {
  const signal: DataPoint[] = [];
  
  // Determine initial polarity by processing bits before startBit
  let lastOnePolarity = -1;
  for (let i = 0; i < startBit; i++) {
    if (allBits[i] === 1) {
      lastOnePolarity = lastOnePolarity === 1 ? -1 : 1;
    }
  }

  const bitsLength = endBit;
  for (let i = startBit; i < endBit; i++) {
    // Check for 8 consecutive zeros (need to check in full array)
    let isEightZeros = true;
    if (i + 7 < bitsLength) {
      for (let j = 0; j < 8; j++) {
        if (allBits[i + j] !== 0) {
          isEightZeros = false;
          break;
        }
      }
    } else {
      isEightZeros = false;
    }
    
    if (isEightZeros) {
      // Replace with B8ZS substitution pattern: 000VB0VB
      // V = violation (same polarity as last), B = bipolar (opposite polarity)
      const V = lastOnePolarity;
      const B = lastOnePolarity === 1 ? -1 : 1;
      
      // 000VB0VB pattern
      const pattern = [0, 0, 0, V, B, 0, V, B];
      for (let j = 0; j < 8; j++) {
        const x1 = (i + j) * bitDuration;
        const x2 = (i + j + 1) * bitDuration;
        signal.push({ x: x1, y: pattern[j] });
        signal.push({ x: x2, y: pattern[j] });
      }
      
      lastOnePolarity = B;
      i += 7; // Skip the next 7 bits (loop increment will add 1)
    } else {
      // Normal AMI encoding
      let voltage = 0;
      if (allBits[i] === 1) {
        lastOnePolarity = lastOnePolarity === 1 ? -1 : 1;
        voltage = lastOnePolarity;
      }
      signal.push({ x: i * bitDuration, y: voltage });
      signal.push({ x: (i + 1) * bitDuration, y: voltage });
    }
  }
  return signal;
}

/**
 * HDB3 (High-Density Bipolar 3): Same as AMI, but string of 4 zeros 
 * replaced with pattern containing violation.
 * Needs full context to determine polarity and ones count.
 */
function generateHDB3(allBits: number[], bitDuration: number, startBit: number, endBit: number): DataPoint[] {
  const signal: DataPoint[] = [];
  
  // Determine initial polarity and ones count by processing bits before startBit
  let lastOnePolarity = -1;
  let onesCount = 0; // Count of ones since last substitution
  for (let i = 0; i < startBit; i++) {
    if (allBits[i] === 1) {
      lastOnePolarity = lastOnePolarity === 1 ? -1 : 1;
      onesCount++;
    }
  }

  const bitsLength = endBit;
  for (let i = startBit; i < endBit; i++) {
    // Check for 4 consecutive zeros (need to check in full array)
    let isFourZeros = true;
    if (i + 3 < bitsLength) {
      for (let j = 0; j < 4; j++) {
        if (allBits[i + j] !== 0) {
          isFourZeros = false;
          break;
        }
      }
    } else {
      isFourZeros = false;
    }
    
    if (isFourZeros) {
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
        const x1 = (i + j) * bitDuration;
        const x2 = (i + j + 1) * bitDuration;
        signal.push({ x: x1, y: pattern[j] });
        signal.push({ x: x2, y: pattern[j] });
      }
      
      onesCount = 0;
      i += 3; // Skip the next 3 bits (loop increment will add 1)
    } else {
      // Normal AMI encoding
      let voltage = 0;
      if (allBits[i] === 1) {
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
