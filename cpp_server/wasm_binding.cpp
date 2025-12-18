#include "SignalLib.h"
#include <emscripten/bind.h>

using namespace emscripten;
using namespace SignalLib;

EMSCRIPTEN_BINDINGS(signal_lib) {
  value_object<Point>("Point").field("x", &Point::x).field("y", &Point::y);

  value_object<SignalResult>("SignalResult")
      .field("input", &SignalResult::input)
      .field("transmitted", &SignalResult::transmitted)
      .field("output", &SignalResult::output)
      .field("calculation_time_ms", &SignalResult::calculation_time_ms);

  register_vector<Point>("VectorPoint");

  enum_<AnalogModulation>("AnalogModulation")
      .value("AM", AnalogModulation::AM)
      .value("FM", AnalogModulation::FM)
      .value("PM", AnalogModulation::PM);

  function("AnalogToAnalog", &AnalogToAnalog);

  value_object<PCMConfig>("PCMConfig")
      .field("sampling_rate", &PCMConfig::sampling_rate)
      .field("quantization_levels", &PCMConfig::quantization_levels);

  value_object<DMConfig>("DMConfig")
      .field("sampling_rate", &DMConfig::sampling_rate)
      .field("delta_step_size", &DMConfig::delta_step_size);

  function("AnalogToDigitalPCM", &AnalogToDigitalPCM);
  function("AnalogToDigitalDM", &AnalogToDigitalDM);

  enum_<DigitalModulation>("DigitalModulation")
      .value("ASK", DigitalModulation::ASK)
      .value("FSK", DigitalModulation::FSK)
      .value("PSK", DigitalModulation::PSK);

  function("DigitalToAnalog", &DigitalToAnalog);

  enum_<LineCoding>("LineCoding")
      .value("NRZ_L", LineCoding::NRZ_L)
      .value("NRZ_I", LineCoding::NRZ_I)
      .value("MANCHESTER", LineCoding::MANCHESTER)
      .value("DIFFERENTIAL_MANCHESTER", LineCoding::DIFFERENTIAL_MANCHESTER)
      .value("AMI", LineCoding::AMI)
      .value("PSEUDOTERNARY", LineCoding::PSEUDOTERNARY)
      .value("B8ZS", LineCoding::B8ZS)
      .value("HDB3", LineCoding::HDB3);

  function("DigitalToDigital", &DigitalToDigital);
}
