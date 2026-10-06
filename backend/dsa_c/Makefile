# Makefile for ResumeRank Unit 3 & Unit 4 C Implementations
# Compatible with GCC, Clang, and MinGW on Windows

CC ?= gcc
CFLAGS ?= -Wall -Wextra -O2 -std=c99
LDFLAGS ?= -lm

# Executable extension (.exe on Windows, empty on Unix/macOS)
ifeq ($(OS),Windows_NT)
    EXT = .exe
else
    EXT =
endif

TARGETS = knapsack$(EXT) branch_bound$(EXT)

.PHONY: all clean demo test

all: $(TARGETS)

knapsack$(EXT): knapsack.c
	$(CC) $(CFLAGS) knapsack.c -o knapsack$(EXT) $(LDFLAGS)

branch_bound$(EXT): branch_bound.c
	$(CC) $(CFLAGS) branch_bound.c -o branch_bound$(EXT) $(LDFLAGS)

demo: all
	@echo "=== Running 0/1 Knapsack Demo ==="
	./knapsack$(EXT) --demo
	@echo "\n=== Running Branch and Bound Demo ==="
	./branch_bound$(EXT) --demo

clean:
	rm -f knapsack knapsack.exe branch_bound branch_bound.exe *.o
