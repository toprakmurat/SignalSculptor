#include <iostream>
#include <memory>
#include <string>

#include <grpcpp/grpcpp.h>
#include "service_impl.h"

using grpc::Server;
using grpc::ServerBuilder;

void RunServer() {
    std::string server_address("0.0.0.0:50051");
    SignalConversionServiceImpl service;

    ServerBuilder builder;
    builder.AddListeningPort(server_address, grpc::InsecureServerCredentials());
    builder.RegisterService(&service);
    std::unique_ptr<Server> server(builder.BuildAndStart());
    std::cout << "Server listening on " << server_address << std::endl;
    server->Wait();
}

int main(int argc, char** argv) {
    RunServer();
    return 0;
}
