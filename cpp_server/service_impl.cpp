#include "service_impl.h"
#include "SignalLib.h"
#include <iostream>

using grpc::ServerContext;
using grpc::Status;

// Helper to copy data from SignalLib::Point to protobuf
void copy_points(
    const std::vector<SignalLib::Point> &src,
    google::protobuf::RepeatedPtrField<signal_scope::DataPoint> *dst) {
  dst->Reserve(src.size());
  for (const auto &p : src) {
    auto *dp = dst->Add();
    dp->set_x(p.x);
    dp->set_y(p.y);
  }
}

Status SignalConversionServiceImpl::AnalogToAnalog(
    ServerContext *context, const AnalogToAnalogRequest *request,
    SignalResponse *reply) {

  SignalLib::AnalogModulation type;
  switch (request->algorithm()) {
  case AnalogToAnalogRequest::AM:
    type = SignalLib::AnalogModulation::AM;
    break;
  case AnalogToAnalogRequest::FM:
    type = SignalLib::AnalogModulation::FM;
    break;
  case AnalogToAnalogRequest::PM:
    type = SignalLib::AnalogModulation::PM;
    break;
  default:
    return Status(grpc::UNIMPLEMENTED, "Algorithm not implemented");
  }

  auto result = SignalLib::AnalogToAnalog(request->message_frequency(),
                                          request->message_amplitude(), type);

  if (result.input.empty() && result.transmitted.empty()) {
    return Status(grpc::INVALID_ARGUMENT, "Invalid parameters");
  }

  copy_points(result.input, reply->mutable_input());
  copy_points(result.transmitted, reply->mutable_transmitted());
  copy_points(result.output, reply->mutable_output());
  reply->set_calculation_time_ms(result.calculation_time_ms);

  return Status::OK;
}

Status SignalConversionServiceImpl::AnalogToDigital(
    ServerContext *context, const AnalogToDigitalRequest *request,
    SignalResponse *reply) {

  SignalLib::SignalResult result;

  if (request->has_pcm()) {
    const auto &config = request->pcm();
    SignalLib::PCMConfig pcm_config{config.sampling_rate(),
                                    config.quantization_levels()};
    result = SignalLib::AnalogToDigitalPCM(request->frequency(),
                                           request->amplitude(), pcm_config);
  } else if (request->has_delta_modulation()) {
    const auto &config = request->delta_modulation();
    SignalLib::DMConfig dm_config{config.sampling_rate(),
                                  config.delta_step_size()};
    result = SignalLib::AnalogToDigitalDM(request->frequency(),
                                          request->amplitude(), dm_config);
  } else {
    return Status(grpc::INVALID_ARGUMENT, "Missing configuration");
  }

  if (result.input.empty() && result.transmitted.empty()) {
    return Status(grpc::INVALID_ARGUMENT, "Invalid parameters or result");
  }

  copy_points(result.input, reply->mutable_input());
  copy_points(result.transmitted, reply->mutable_transmitted());
  copy_points(result.output, reply->mutable_output());
  reply->set_calculation_time_ms(result.calculation_time_ms);

  return Status::OK;
}

Status SignalConversionServiceImpl::DigitalToAnalog(
    ServerContext *context, const DigitalToAnalogRequest *request,
    SignalResponse *reply) {

  SignalLib::DigitalModulation type;
  switch (request->algorithm()) {
  case DigitalToAnalogRequest::ASK:
    type = SignalLib::DigitalModulation::ASK;
    break;
  case DigitalToAnalogRequest::FSK:
    type = SignalLib::DigitalModulation::FSK;
    break;
  case DigitalToAnalogRequest::PSK:
    type = SignalLib::DigitalModulation::PSK;
    break;
  default:
    return Status(grpc::UNIMPLEMENTED, "Algorithm not implemented");
  }

  auto result = SignalLib::DigitalToAnalog(request->binary_input(), type);

  if (result.input.empty() && result.transmitted.empty()) {
    return Status(grpc::INVALID_ARGUMENT, "Invalid parameters");
  }

  copy_points(result.input, reply->mutable_input());
  copy_points(result.transmitted, reply->mutable_transmitted());
  copy_points(result.output, reply->mutable_output());
  reply->set_calculation_time_ms(result.calculation_time_ms);

  return Status::OK;
}

Status SignalConversionServiceImpl::DigitalToDigital(
    ServerContext *context, const DigitalToDigitalRequest *request,
    SignalResponse *reply) {

  SignalLib::LineCoding type;
  switch (request->algorithm()) {
  case DigitalToDigitalRequest::NRZ_L:
    type = SignalLib::LineCoding::NRZ_L;
    break;
  case DigitalToDigitalRequest::NRZ_I:
    type = SignalLib::LineCoding::NRZ_I;
    break;
  case DigitalToDigitalRequest::MANCHESTER:
    type = SignalLib::LineCoding::MANCHESTER;
    break;
  case DigitalToDigitalRequest::DIFFERENTIAL_MANCHESTER:
    type = SignalLib::LineCoding::DIFFERENTIAL_MANCHESTER;
    break;
  case DigitalToDigitalRequest::AMI:
    type = SignalLib::LineCoding::AMI;
    break;
  case DigitalToDigitalRequest::PSEUDOTERNARY:
    type = SignalLib::LineCoding::PSEUDOTERNARY;
    break;
  case DigitalToDigitalRequest::B8ZS:
    type = SignalLib::LineCoding::B8ZS;
    break;
  case DigitalToDigitalRequest::HDB3:
    type = SignalLib::LineCoding::HDB3;
    break;
  default:
    return Status(grpc::UNIMPLEMENTED, "Algorithm not implemented");
  }

  auto result = SignalLib::DigitalToDigital(request->binary_input(), type);

  if (result.input.empty() && result.transmitted.empty()) {
    return Status(grpc::INVALID_ARGUMENT, "Invalid parameters");
  }

  copy_points(result.input, reply->mutable_input());
  copy_points(result.transmitted, reply->mutable_transmitted());
  copy_points(result.output, reply->mutable_output());
  reply->set_calculation_time_ms(result.calculation_time_ms);

  return Status::OK;
}
