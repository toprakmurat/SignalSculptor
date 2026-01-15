#pragma once
#include <vector>
#include <string>
#include <cmath>
#include <algorithm>

namespace SignalLib {

struct Point {
    double x;
    double y;
};

struct SignalResult {
    std::vector<Point> input;
    std::vector<Point> transmitted;
    std::vector<Point> output;
    double calculation_time_ms;
};

enum class AnalogModulation { AM, FM, PM };

SignalResult AnalogToAnalog(double msg_freq, double msg_amp, AnalogModulation type);

struct PCMConfig {
    double sampling_rate;
    int quantization_levels;
};

struct DMConfig {
    double sampling_rate;
    double delta_step_size;
};

SignalResult AnalogToDigitalPCM(double freq, double amp, const PCMConfig& config);
SignalResult AnalogToDigitalDM(double freq, double amp, const DMConfig& config);

enum class DigitalModulation { ASK, BFSK, MFSK, BPSK, DPSK, QPSK, OQPSK, MPSK, QAM };
SignalResult DigitalToAnalog(const std::string& binary, DigitalModulation type);

enum class LineCoding { NRZ_L, NRZ_I, MANCHESTER, DIFFERENTIAL_MANCHESTER, AMI, PSEUDOTERNARY, B8ZS, HDB3 };
SignalResult DigitalToDigital(const std::string& binary, LineCoding type);

}
