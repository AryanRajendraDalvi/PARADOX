cmake_minimum_required(VERSION 3.14)
project(qds_framework CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# ─── Fetch Eigen (header-only) ────────────────────────────────────────────────
include(FetchContent)
FetchContent_Declare(
  Eigen
  GIT_REPOSITORY https://gitlab.com/libeigen/eigen.git
  GIT_TAG        3.4.0
  GIT_SHALLOW    TRUE
  GIT_PROGRESS   TRUE
)
set(EIGEN_BUILD_DOC      OFF CACHE BOOL "" FORCE)
set(BUILD_TESTING        OFF CACHE BOOL "" FORCE)
set(EIGEN_BUILD_PKGCONFIG OFF CACHE BOOL "" FORCE)
FetchContent_MakeAvailable(Eigen)

# ─── Sources ──────────────────────────────────────────────────────────────────
file(GLOB_RECURSE QDS_SOURCES
    src/core/*.cpp
    src/protocol/*.cpp
    src/detection/*.cpp
    src/stats/*.cpp
    src/auth/*.cpp
    src/audit/*.cpp
    src/simulation/*.cpp
)

add_executable(qds_sim main.cpp ${QDS_SOURCES})
target_include_directories(qds_sim PRIVATE src)
target_link_libraries(qds_sim PRIVATE Eigen3::Eigen)

# Compiler warnings
if(MSVC)
    target_compile_options(qds_sim PRIVATE /W3)
else()
    target_compile_options(qds_sim PRIVATE -Wall -Wextra -O2)
endif()
