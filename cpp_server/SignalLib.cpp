#include "SignalLib.h"
#include <chrono>
#include <iostream>
#include <numbers>

namespace SignalLib {

// Constants
constexpr double PI = 3.14159265358979323846;

// Helper: get_input_value_at_time
double get_input_value_at_time(const std::vector<Point> &input_signal,
                               double time) {
  if (input_signal.empty())
    return 0.0;

  if (time <= input_signal.front().x)
    return input_signal.front().y;
  if (time >= input_signal.back().x)
    return input_signal.back().y;

  auto it = std::lower_bound(input_signal.begin(), input_signal.end(), time,
                             [](const Point &p, double t) { return p.x < t; });

  if (it == input_signal.begin())
    return it->y;

  const auto &p2 = *it;
  const auto &p1 = *(it - 1);

  if (p2.x == p1.x)
    return p1.y;

  double ratio = (time - p1.x) / (p2.x - p1.x);
  return p1.y + ratio * (p2.y - p1.y);
}

// --- Analog To Analog ---

SignalResult AnalogToAnalog(double msg_freq, double msg_amp,
                            AnalogModulation type) {
  auto start_time = std::chrono::high_resolution_clock::now();
  SignalResult result;

  if (msg_freq <= 0 || msg_amp <= 0) {
    return result; // Empty result indicating error/invalid input
  }

  double duration = 2.0;
  int samples_per_sec = 200;
  int total_samples = static_cast<int>(duration * samples_per_sec);

  std::vector<Point> input_signal(total_samples);
  const double two_pi_freq = 2 * PI * msg_freq;
  double inv_samples = 1.0 / samples_per_sec;

  for (int i = 0; i < total_samples; i++) {
    double t = i * inv_samples;
    double y = msg_amp * std::sin(two_pi_freq * t);
    input_signal[i] = {t, y};
  }

  std::vector<Point> transmitted_signal(total_samples);
  double carrier_freq = msg_freq * 5;
  constexpr double carrier_amp = 1.0;
  const double two_pi_carrier = 2 * PI * carrier_freq;

  switch (type) {
  case AnalogModulation::AM: {
    double mod_index = 0.8;
    double inv_msg_amp = 1.0 / msg_amp;
    for (int i = 0; i < total_samples; i++) {
      double t = input_signal[i].x;
      double msg = input_signal[i].y * inv_msg_amp;
      double carrier = std::sin(two_pi_carrier * t);
      double val = carrier_amp * (1 + mod_index * msg) * carrier;
      transmitted_signal[i] = {t, val};
    }
    break;
  }
  case AnalogModulation::FM: {
    double freq_dev = carrier_freq * 0.5;
    double inv_msg_amp = 1.0 / msg_amp;
    double inv_msg_freq = 1.0 / msg_freq;
    const double two_pi_dev = 2 * PI * freq_dev;

    for (int i = 0; i < total_samples; i++) {
      double t = input_signal[i].x;
      double msg = input_signal[i].y * inv_msg_amp;
      double instantaneous_phase =
          two_pi_carrier * t + two_pi_dev * msg * t * inv_msg_freq;
      double val = carrier_amp * std::sin(instantaneous_phase);
      transmitted_signal[i] = {t, val};
    }
    break;
  }
  case AnalogModulation::PM: {
    constexpr double phase_dev = PI / 2.0;
    double inv_msg_amp = 1.0 / msg_amp;
    for (int i = 0; i < total_samples; i++) {
      double t = input_signal[i].x;
      double msg = input_signal[i].y * inv_msg_amp;
      double instantaneous_phase = two_pi_carrier * t + phase_dev * msg;
      double val = carrier_amp * std::sin(instantaneous_phase);
      transmitted_signal[i] = {t, val};
    }
    break;
  }
  }

  result.input = input_signal;
  result.transmitted = transmitted_signal;
  result.output = input_signal; // Same as input for A-A

  auto end_time = std::chrono::high_resolution_clock::now();
  result.calculation_time_ms =
      std::chrono::duration<double, std::milli>(end_time - start_time).count();
  return result;
}

// --- Analog To Digital ---

SignalResult AnalogToDigitalPCM(double freq, double amp,
                                const PCMConfig &config) {
  auto start_time = std::chrono::high_resolution_clock::now();
  SignalResult result;

  if (freq <= 0 || amp <= 0 || config.sampling_rate <= 0 ||
      config.quantization_levels < 2) {
    return result;
  }

  double duration = 2.0;
  int samples_per_sec = 100;
  int total_samples = static_cast<int>(duration * samples_per_sec);

  std::vector<Point> input_signal(total_samples);
  const double two_pi_freq = 2 * PI * freq;

  for (int i = 0; i < total_samples; i++) {
    double t = i * (1.0 / samples_per_sec);
    double y = amp * std::sin(two_pi_freq * t);
    input_signal[i] = {t, y};
  }

  std::vector<Point> transmitted;
  std::vector<Point> output;

  // PCM Logic
  double sample_interval = 1.0 / config.sampling_rate;
  double real_duration = input_signal.back().x;

  double inv_amp = 1.0 / amp;
  double quant_range = config.quantization_levels - 1;
  double inv_quant_range = 1.0 / quant_range;

  for (int i = 0;; i++) {
    double t = i * sample_interval;
    if (t > real_duration)
      break;

    t = std::round(t * 1000000) / 1000000.0;
    double input_val = get_input_value_at_time(input_signal, t);

    double normalized = (input_val * inv_amp + 1) * 0.5;
    double quantized = std::round(normalized * quant_range);
    double reconstructed = (quantized * inv_quant_range * 2 - 1) * amp;

    transmitted.push_back({t, quantized});
    output.push_back({t, reconstructed});
  }

  result.input = input_signal;
  result.transmitted = transmitted;
  result.output = output;

  auto end_time = std::chrono::high_resolution_clock::now();
  result.calculation_time_ms =
      std::chrono::duration<double, std::milli>(end_time - start_time).count();
  return result;
}

SignalResult AnalogToDigitalDM(double freq, double amp,
                               const DMConfig &config) {
  auto start_time = std::chrono::high_resolution_clock::now();
  SignalResult result;

  if (freq <= 0 || amp <= 0 || config.sampling_rate <= 0 ||
      config.delta_step_size <= 0 || config.delta_step_size > 1) {
    return result;
  }

  double duration = 2.0;
  int samples_per_sec = 100;
  int total_samples = static_cast<int>(duration * samples_per_sec);

  std::vector<Point> input_signal(total_samples);
  const double two_pi_freq = 2 * PI * freq;

  for (int i = 0; i < total_samples; i++) {
    double t = i * (1.0 / samples_per_sec);
    double y = amp * std::sin(two_pi_freq * t);
    input_signal[i] = {t, y};
  }

  std::vector<Point> transmitted;
  std::vector<Point> output;

  double delta = amp * config.delta_step_size;
  double sample_interval = 1.0 / config.sampling_rate;
  double real_duration = input_signal.back().x;

  double min_approx = -amp * 1.5;
  double max_approx = amp * 1.5;
  double approximation = 0;

  output.push_back({0, approximation});

  for (int i = 0;; i++) {
    double t = i * sample_interval;
    if (t > real_duration)
      break;

    t = std::round(t * 1000000) / 1000000.0;

    double input_val = get_input_value_at_time(input_signal, t);
    double bit = (input_val > approximation) ? 1.0 : 0.0;

    transmitted.push_back({t, bit});

    approximation += (bit == 1.0) ? delta : -delta;
    approximation = std::max(min_approx, std::min(max_approx, approximation));

    if (!output.empty()) {
      double prev_y = output.back().y;
      output.push_back({t - 0.001, prev_y});
    }
    output.push_back({t, approximation});
  }

  // Extend last value
  if (!output.empty()) {
    output.push_back({input_signal.back().x, output.back().y});
  }

  result.input = input_signal;
  result.transmitted = transmitted;
  result.output = output;

  auto end_time = std::chrono::high_resolution_clock::now();
  result.calculation_time_ms =
      std::chrono::duration<double, std::milli>(end_time - start_time).count();
  return result;
}

// --- Digital To Analog ---

SignalResult DigitalToAnalog(const std::string &binary,
                             DigitalModulation type) {
  auto start_time = std::chrono::high_resolution_clock::now();
  SignalResult result;

  if (binary.empty())
    return result;
  for (char c : binary) {
    if (c != '0' && c != '1')
      return result;
  }

  constexpr double bit_duration = 1.0;
  constexpr int samples_per_bit = 100;
  size_t num_bits = binary.size();

  std::vector<Point> input_signal;
  input_signal.reserve(num_bits * 2);
  for (size_t i = 0; i < num_bits; i++) {
    double x1 = i * bit_duration;
    double x2 = (i + 1) * bit_duration;
    double y = (binary[i] == '1') ? 1.0 : 0.0;
    input_signal.push_back({x1, y});
    input_signal.push_back({x2, y});
  }

  std::vector<Point> transmitted;
  transmitted.reserve(num_bits * (samples_per_bit + 1));

  switch (type) {
  case DigitalModulation::ASK: {
    constexpr double carrier_freq = 5.0;
    constexpr double two_pi_carrier = 2 * PI * carrier_freq;
    constexpr double time_step = bit_duration / samples_per_bit;

    for (size_t i = 0; i < num_bits; i++) {
      double amplitude = (binary[i] == '1') ? 1.0 : 0.2;
      double base_time = i * bit_duration;
      for (int j = 0; j <= samples_per_bit; j++) {
        double t = base_time + j * time_step;
        double y = amplitude * std::sin(two_pi_carrier * t);
        transmitted.push_back({t, y});
      }
    }
    break;
  }
  case DigitalModulation::FSK: {
    constexpr double freq0 = 3.0;
    constexpr double freq1 = 7.0;
    constexpr double two_pi_freq0 = 2 * PI * freq0;
    constexpr double two_pi_freq1 = 2 * PI * freq1;
    constexpr double time_step = bit_duration / samples_per_bit;

    for (size_t i = 0; i < num_bits; i++) {
      double base_time = i * bit_duration;
      double two_pi_freq = (binary[i] == '1') ? two_pi_freq1 : two_pi_freq0;
      for (int j = 0; j <= samples_per_bit; j++) {
        double t = base_time + j * time_step;
        double y = std::sin(two_pi_freq * t);
        transmitted.push_back({t, y});
      }
    }
    break;
  }
  case DigitalModulation::PSK: {
    constexpr double carrier_freq = 5.0;
    constexpr double two_pi_carrier = 2 * PI * carrier_freq;
    constexpr double time_step = bit_duration / samples_per_bit;

    for (size_t i = 0; i < num_bits; i++) {
      double base_time = i * bit_duration;
      double phase_shift = (binary[i] == '1') ? 0.0 : PI;
      for (int j = 0; j <= samples_per_bit; j++) {
        double t = base_time + j * time_step;
        double y = std::sin(two_pi_carrier * t + phase_shift);
        transmitted.push_back({t, y});
      }
    }
    break;
  }
  }

  result.input = input_signal;
  result.transmitted = transmitted;
  result.output =
      input_signal; // Reconstructed often same as input for simple simulation

  auto end_time = std::chrono::high_resolution_clock::now();
  result.calculation_time_ms =
      std::chrono::duration<double, std::milli>(end_time - start_time).count();
  return result;
}

// --- Digital To Digital ---

SignalResult DigitalToDigital(const std::string &binary, LineCoding type) {
  auto start_time = std::chrono::high_resolution_clock::now();
  SignalResult result;

  if (binary.empty())
    return result;
  for (char c : binary) {
    if (c != '0' && c != '1')
      return result;
  }

  constexpr double bit_duration = 1.0;
  size_t num_bits = binary.size();

  std::vector<Point> input_signal;
  input_signal.reserve(num_bits * 2);
  for (size_t i = 0; i < num_bits; i++) {
    double x1 = i * bit_duration;
    double x2 = (i + 1) * bit_duration;
    double val = (binary[i] == '1') ? 1.0 : 0.0;
    input_signal.push_back({x1, val});
    input_signal.push_back({x2, val});
  }

  std::vector<Point> transmitted;
  transmitted.reserve(num_bits * 2);

  switch (type) {
  case LineCoding::NRZ_L: {
    for (size_t i = 0; i < num_bits; i++) {
      double voltage = (binary[i] == '0') ? 1.0 : -1.0;
      transmitted.push_back({i * bit_duration, voltage});
      transmitted.push_back({(i + 1) * bit_duration, voltage});
    }
    break;
  }
  case LineCoding::NRZ_I: {
    double current_level = 1.0;
    for (size_t i = 0; i < num_bits; i++) {
      if (binary[i] == '1')
        current_level = -current_level;
      transmitted.push_back({i * bit_duration, current_level});
      transmitted.push_back({(i + 1) * bit_duration, current_level});
    }
    break;
  }
  case LineCoding::MANCHESTER: {
    for (size_t i = 0; i < num_bits; i++) {
      double base = i * bit_duration;
      double mid = (i + 0.5) * bit_duration;
      double end = (i + 1) * bit_duration;
      if (binary[i] == '0') { // High to low
        transmitted.push_back({base, 1.0});
        transmitted.push_back({mid, 1.0});
        transmitted.push_back({mid, -1.0});
        transmitted.push_back({end, -1.0});
      } else { // Low to high
        transmitted.push_back({base, -1.0});
        transmitted.push_back({mid, -1.0});
        transmitted.push_back({mid, 1.0});
        transmitted.push_back({end, 1.0});
      }
    }
    break;
  }
  case LineCoding::DIFFERENTIAL_MANCHESTER: {
    double current_level = 1.0;
    for (size_t i = 0; i < num_bits; i++) {
      if (binary[i] == '0')
        current_level = -current_level;

      double base = i * bit_duration;
      double mid = (i + 0.5) * bit_duration;
      double end = (i + 1) * bit_duration;

      transmitted.push_back({base, current_level});
      transmitted.push_back({mid, current_level});

      current_level = -current_level;

      transmitted.push_back({mid, current_level});
      transmitted.push_back({end, current_level});
    }
    break;
  }
  case LineCoding::AMI: {
    double last_one_polarity = -1.0;
    for (size_t i = 0; i < num_bits; i++) {
      double voltage = 0;
      if (binary[i] == '1') {
        last_one_polarity = -last_one_polarity;
        voltage = last_one_polarity;
      }
      transmitted.push_back({i * bit_duration, voltage});
      transmitted.push_back({(i + 1) * bit_duration, voltage});
    }
    break;
  }
  case LineCoding::PSEUDOTERNARY: {
    double last_zero_polarity = -1.0;
    for (size_t i = 0; i < num_bits; i++) {
      double voltage = 0;
      if (binary[i] == '0') {
        last_zero_polarity = -last_zero_polarity;
        voltage = last_zero_polarity;
      }
      transmitted.push_back({i * bit_duration, voltage});
      transmitted.push_back({(i + 1) * bit_duration, voltage});
    }
    break;
  }
  case LineCoding::B8ZS: {
    double last_one_polarity = -1.0;
    for (size_t i = 0; i < num_bits; i++) {
      bool is_eight_zeros = true;
      if (i + 7 < num_bits) {
        for (int j = 0; j < 8; j++)
          if (binary[i + j] != '0')
            is_eight_zeros = false;
      } else {
        is_eight_zeros = false;
      }

      if (is_eight_zeros) {
        double V = last_one_polarity;
        double B = -last_one_polarity;
        double pattern[] = {0, 0, 0, V, B, 0, V, B};

        for (int j = 0; j < 8; j++) {
          double t1 = (i + j) * bit_duration;
          double t2 = (i + j + 1) * bit_duration;
          transmitted.push_back({t1, pattern[j]});
          transmitted.push_back({t2, pattern[j]});
        }

        last_one_polarity = B;
        i += 7;
      } else {
        double voltage = 0;
        if (binary[i] == '1') {
          last_one_polarity = -last_one_polarity;
          voltage = last_one_polarity;
        }
        transmitted.push_back({i * bit_duration, voltage});
        transmitted.push_back({(i + 1) * bit_duration, voltage});
      }
    }
    break;
  }
  case LineCoding::HDB3: {
    double last_one_polarity = -1.0;
    int ones_count = 0;

    for (size_t i = 0; i < num_bits; i++) {
      bool is_four_zeros = true;
      if (i + 3 < num_bits) {
        for (int j = 0; j < 4; j++)
          if (binary[i + j] != '0')
            is_four_zeros = false;
      } else {
        is_four_zeros = false;
      }

      if (is_four_zeros) {
        std::vector<double> pattern;
        if (ones_count % 2 == 0) { // Even: 000V
          double V = last_one_polarity;
          pattern = {0, 0, 0, V};
          last_one_polarity = V;
        } else { // Odd: B00V
          double B = -last_one_polarity;
          double V = B;
          pattern = {B, 0, 0, V};
          last_one_polarity = V;
        }

        for (int j = 0; j < 4; j++) {
          double t1 = (i + j) * bit_duration;
          double t2 = (i + j + 1) * bit_duration;
          transmitted.push_back({t1, pattern[j]});
          transmitted.push_back({t2, pattern[j]});
        }

        ones_count = 0;
        i += 3;
      } else {
        double voltage = 0;
        if (binary[i] == '1') {
          last_one_polarity = -last_one_polarity;
          voltage = last_one_polarity;
          ones_count++;
        }
        transmitted.push_back({i * bit_duration, voltage});
        transmitted.push_back({(i + 1) * bit_duration, voltage});
      }
    }
    break;
  }
  }

  result.input = input_signal;
  result.transmitted = transmitted;
  result.output = input_signal; // Reconstructed

  auto end_time = std::chrono::high_resolution_clock::now();
  result.calculation_time_ms =
      std::chrono::duration<double, std::milli>(end_time - start_time).count();
  return result;
}

} // namespace SignalLib
