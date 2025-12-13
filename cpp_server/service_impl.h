#pragma once

#include "signal.grpc.pb.h"
#include <grpcpp/grpcpp.h>

using grpc::ServerContext;
using grpc::Status;
using signal_scope::AnalogToAnalogRequest;
using signal_scope::AnalogToDigitalRequest;
using signal_scope::DigitalToAnalogRequest;
using signal_scope::DigitalToDigitalRequest;
using signal_scope::SignalConversion;
using signal_scope::SignalResponse;

class SignalConversionServiceImpl final : public SignalConversion::Service {
public:
  Status AnalogToAnalog(ServerContext *context,
                        const AnalogToAnalogRequest *request,
                        SignalResponse *reply) override;

  Status AnalogToDigital(ServerContext *context,
                         const AnalogToDigitalRequest *request,
                         SignalResponse *reply) override;

  Status DigitalToAnalog(ServerContext *context,
                         const DigitalToAnalogRequest *request,
                         SignalResponse *reply) override;

  Status DigitalToDigital(ServerContext *context,
                          const DigitalToDigitalRequest *request,
                          SignalResponse *reply) override;
};
