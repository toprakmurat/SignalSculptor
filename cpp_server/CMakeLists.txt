cmake_minimum_required(VERSION 3.15)
project(GrpcTest C CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_EXPORT_COMPILE_COMMANDS ON)
set(CMAKE_PREFIX_PATH "$ENV{HOME}/.local")

# Find Protobuf installation
find_package(Protobuf CONFIG REQUIRED)
# Find gRPC installation
find_package(gRPC CONFIG REQUIRED)

# Proto file
set(PROTO_FILE "../protos/signal.proto")

# Generate sources
get_filename_component(PROTO_ABS "${PROTO_FILE}" ABSOLUTE)
get_filename_component(PROTO_DIR "${PROTO_ABS}" DIRECTORY)

# Generated sources
set(PROTO_SRCS "${CMAKE_CURRENT_BINARY_DIR}/signal.pb.cc")
set(PROTO_HDRS "${CMAKE_CURRENT_BINARY_DIR}/signal.pb.h")
set(GRPC_SRCS "${CMAKE_CURRENT_BINARY_DIR}/signal.grpc.pb.cc")
set(GRPC_HDRS "${CMAKE_CURRENT_BINARY_DIR}/signal.grpc.pb.h")

# Command to generate the files
add_custom_command(
  OUTPUT "${PROTO_SRCS}" "${PROTO_HDRS}" "${GRPC_SRCS}" "${GRPC_HDRS}"
  COMMAND protobuf::protoc
    --grpc_out="${CMAKE_CURRENT_BINARY_DIR}"
    --cpp_out="${CMAKE_CURRENT_BINARY_DIR}"
    --plugin=protoc-gen-grpc=$<TARGET_FILE:gRPC::grpc_cpp_plugin>
    -I "${PROTO_DIR}"
    "${PROTO_ABS}"
  DEPENDS "${PROTO_ABS}"
)

# --- Server Target ---
add_executable(server main.cpp service_impl.cpp ${PROTO_SRCS} ${GRPC_SRCS})
target_link_libraries(server PRIVATE protobuf::libprotobuf gRPC::grpc++ gRPC::grpc++_reflection)
target_include_directories(server PRIVATE "${CMAKE_CURRENT_BINARY_DIR}")

