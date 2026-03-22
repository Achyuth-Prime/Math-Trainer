import random
import time
import os
import sys
import termios
import tty

# ------------------------------------------
# CONFIGURATION
# ------------------------------------------
LEVELS = {
    0: {"count": 4, "max_val": 20, "start_points": 2},
    1: {"count": 10, "max_val": 20, "start_points": 2},
    2: {"count": 4, "max_val": 50, "start_points": 2},
    3: {"count": 10, "max_val": 50, "start_points": 2},
    4: {"count": 4, "max_val": 100, "start_points": 2},
    5: {"count": 10, "max_val": 100, "start_points": 2}
}

# ------------------------------------------
# UTILS
# ------------------------------------------

def clear():
    os.system('cls' if os.name == 'nt' else 'clear')

def delay(sec=0.7):
    time.sleep(sec)

def get_keypress():
    """Reads one character (no enter required)."""
    fd = sys.stdin.fileno()
    old_settings = termios.tcgetattr(fd)
    try:
        tty.setraw(fd)
        ch = sys.stdin.read(1)
    finally:
        termios.tcsetattr(fd, termios.TCSADRAIN, old_settings)
    return ch

# ------------------------------------------
# DISPLAY FUNCTION
# ------------------------------------------

def draw_dynamic_circle(numbers):
    n = len(numbers)

    # Find the max width (1 digit, 2 digits, etc.)
    width = len(str(max(numbers)))

    # Convert all numbers to strings of equal width
    formatted = [str(num).rjust(width) for num in numbers]

    if n <= 4:
        # Simple diamond
        print(f"      {formatted[0]}")
        print(f"  {formatted[1]}      {formatted[2]}")
        print(f"      {formatted[3]}")
        return

    # For 10 numbers (level 1, 3, 5)
    spacing = " " * (4 + width - 1)  # adjust spacing slightly for wide numbers

    print(f"{spacing*2}{formatted[0]}")
    print(f"{spacing}{formatted[-1]}{spacing*2}{formatted[1]}")
    print(f"{formatted[-2]}{spacing*4}{formatted[2]}")
    print(f"{formatted[-3]}{spacing*4}{formatted[3]}")
    print(f"{spacing}{formatted[-4]}{spacing*2}{formatted[4]}")
    print(f"{spacing*2}{formatted[5]}")

# ------------------------------------------
# GAME LOGIC
# ------------------------------------------

def generate_numbers(level):
    cfg = LEVELS[level]
    if level >= 4:
        return [random.randint(10, cfg["max_val"]) for _ in range(cfg["count"])]
    return [random.randint(1, cfg["max_val"]) for _ in range(cfg["count"])]

def run_level(level):
    cfg = LEVELS[level]
    numbers = generate_numbers(level)
    correct_sum = sum(numbers)
    start_points = random.sample(numbers, cfg["start_points"])

    clear()
    print(f"LEVEL {level}")
    print("-" * 25)
    draw_dynamic_circle(numbers)
    print("-" * 25)
    delay(1.0)

    results = []

    for i, sp in enumerate(start_points):
        print(f"\nStarting point: {sp}")
        t1 = time.time()
        ans = input("Enter your total sum: ").strip()
        t2 = time.time()
        try:
            ans = int(ans)
        except:
            ans = None
        results.append({
            "start_point": sp,
            "your_answer": ans,
            "correct": ans == correct_sum,
            "time": round(t2 - t1, 2)
        })
        delay(0.6)
        if i != len(start_points) - 1:
            clear()
            print(f"LEVEL {level}")
            print("-" * 25)
            draw_dynamic_circle(numbers)
            print("-" * 25)

    # Show summary
    clear()
    print(f"LEVEL {level} SUMMARY")
    print("=" * 40)
    print(f"Numbers: {numbers}")
    print(f"Correct Sum: {correct_sum}\n")
    print(f"{'Start Point':<15}{'Your Ans':<10}{'Time(s)':<10}{'Result'}")
    print("-" * 40)
    for r in results:
        res = "✅" if r["correct"] else "❌"
        print(f"{r['start_point']:<15}{r['your_answer']:<10}{r['time']:<10}{res}")
    print("=" * 40)
    print("")

# ------------------------------------------
# MAIN LOOP
# ------------------------------------------

def main():
    iteration = 1
    while True:
        # clear()
        if iteration == 1:
            print("🧮 Mental Addition Trainer 🧠")
            print("-" * 35)
            print("Levels:")
            for lvl in range(6):
                print(f"  {lvl}: {LEVELS[lvl]['count']} numbers under {LEVELS[lvl]['max_val']}")
            print("-" * 35)
        iteration += 1
        print("Enter level (0–5) to start or any other key to exit: ", end="", flush=True)
        key = get_keypress()
        if key.isdigit() and int(key) in LEVELS:
            level = int(key)
            delay(1)
            run_level(level)
        else:
            print("\n\nGoodbye! 👋")
            delay(1)
            clear()
            break

if __name__ == "__main__":
    main()
