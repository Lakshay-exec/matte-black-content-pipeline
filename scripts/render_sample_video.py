import os
import sys
import math
import subprocess
from PIL import Image, ImageDraw, ImageFont

# Project Paths
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASSETS_DIR = os.path.join(ROOT_DIR, "assets")
OUT_DIR = os.path.join(ROOT_DIR, "out")
REF_STATUE_PATH = os.path.join(ASSETS_DIR, "reference_statue.png")
AUDIO_PATH = os.path.join(ROOT_DIR, "sample_voice.wav")
OUTPUT_VIDEO_PATH = os.path.join(OUT_DIR, "sample_short.mp4")

os.makedirs(OUT_DIR, exist_ok=True)

# Video Specs
WIDTH = 1080
HEIGHT = 1920
FPS = 30
TOTAL_DURATION = 10.13  # matches audio duration
TOTAL_FRAMES = int(TOTAL_DURATION * FPS)

# Typography Setup
def get_font(size, bold=True):
    font_name = "segoeuib.ttf" if bold else "segoeui.ttf"
    font_path = os.path.join("C:/Windows/Fonts", font_name)
    if not os.path.exists(font_path):
        font_path = "C:/Windows/Fonts/arialbd.ttf" if bold else "C:/Windows/Fonts/arial.ttf"
    try:
        return ImageFont.truetype(font_path, size)
    except Exception:
        return ImageFont.load_default()

FONT_HEADER = get_font(26, bold=True)
FONT_HEADLINE = get_font(44, bold=True)
FONT_BADGE = get_font(20, bold=True)
FONT_CARD_TITLE = get_font(34, bold=True)
FONT_CARD_SUBTITLE = get_font(24, bold=False)
FONT_CARD_METRIC = get_font(76, bold=True)
FONT_CARD_METRIC_LABEL = get_font(20, bold=True)
FONT_CARD_BULLET = get_font(22, bold=True)
FONT_CAPTION = get_font(46, bold=True)

# Narration Word Timestamps (Accurately distributed across 10.13s)
WORDS_DATA = [
    ("The", 0.10, 0.35),
    ("future", 0.38, 0.82),
    ("of", 0.85, 1.02),
    ("content", 1.05, 1.55),
    ("is", 1.58, 1.78),
    ("not", 1.80, 2.15),
    ("more", 2.18, 2.50),
    ("noise.", 2.52, 3.10),
    ("It", 3.35, 3.55),
    ("is", 3.58, 3.78),
    ("pure,", 3.80, 4.25),
    ("unfiltered", 4.30, 5.05),
    ("signal.", 5.10, 5.75),
    ("Autonomous", 6.00, 6.75),
    ("pipelines", 6.80, 7.35),
    ("are", 7.40, 7.60),
    ("winning.", 7.65, 8.35),
    ("Subscribe", 8.60, 9.15),
    ("for", 9.18, 9.35),
    ("daily", 9.38, 9.70),
    ("intelligence.", 9.75, 10.10),
]

# Load Reference Statue
ref_img = Image.open(REF_STATUE_PATH).convert("RGBA")

def draw_info_card(draw, card_data, opacity=1.0):
    if opacity <= 0:
        return
    
    card_x = 90
    card_y = 360
    card_w = 900
    card_h = card_data.get("height", 320)
    
    # Neo-brutalist drop shadow (Offset 10px, 10px)
    draw.rounded_rectangle(
        [card_x + 10, card_y + 10, card_x + card_w + 10, card_y + card_h + 10],
        radius=16,
        fill=(0, 0, 0, int(255 * opacity))
    )
    
    # White card body with black border
    draw.rounded_rectangle(
        [card_x, card_y, card_x + card_w, card_y + card_h],
        radius=16,
        fill=(255, 255, 255, int(255 * opacity)),
        outline=(0, 0, 0, int(255 * opacity)),
        width=4
    )
    
    cur_y = card_y + 28
    
    # Badge
    if "badge" in card_data:
        badge_text = card_data["badge"]
        badge_w = int(draw.textlength(badge_text, font=FONT_BADGE)) + 24
        draw.rounded_rectangle(
            [card_x + 32, cur_y, card_x + 32 + badge_w, cur_y + 36],
            radius=6,
            fill=(0, 0, 0, int(255 * opacity))
        )
        draw.text(
            (card_x + 44, cur_y + 7),
            badge_text,
            fill=(255, 255, 255, int(255 * opacity)),
            font=FONT_BADGE
        )
        cur_y += 52
        
    # Big Metric
    if "metric" in card_data:
        metric_str = card_data["metric"]
        draw.text(
            (card_x + 32, cur_y - 8),
            metric_str,
            fill=(0, 0, 0, int(255 * opacity)),
            font=FONT_CARD_METRIC
        )
        cur_y += 78
        if "metric_label" in card_data:
            draw.text(
                (card_x + 34, cur_y - 4),
                card_data["metric_label"],
                fill=(90, 90, 90, int(255 * opacity)),
                font=FONT_CARD_METRIC_LABEL
            )
            cur_y += 34
            
    # Title
    if "title" in card_data:
        draw.text(
            (card_x + 32, cur_y),
            card_data["title"],
            fill=(0, 0, 0, int(255 * opacity)),
            font=FONT_CARD_TITLE
        )
        cur_y += 46
        
    # Subtitle
    if "subtitle" in card_data:
        draw.text(
            (card_x + 32, cur_y),
            card_data["subtitle"],
            fill=(70, 70, 70, int(255 * opacity)),
            font=FONT_CARD_SUBTITLE
        )
        cur_y += 36
        
    # Bullet Points
    if "bullets" in card_data:
        cur_y += 8
        for b in card_data["bullets"]:
            # bullet dot
            draw.ellipse(
                [card_x + 34, cur_y + 8, card_x + 44, cur_y + 18],
                fill=(0, 0, 0, int(255 * opacity))
            )
            draw.text(
                (card_x + 56, cur_y),
                b,
                fill=(20, 20, 20, int(255 * opacity)),
                font=FONT_CARD_BULLET
            )
            cur_y += 36

def render_frame(frame_idx):
    current_time = frame_idx / FPS
    progress = min(1.0, current_time / TOTAL_DURATION)
    
    # 1. Base pure solid white canvas #FFFFFF
    frame = Image.new("RGBA", (WIDTH, HEIGHT), (255, 255, 255, 255))
    draw = ImageDraw.Draw(frame)
    
    # 2. Subtle ambient backdrop gradient circle in center
    center_y = 1120
    draw.ellipse(
        [WIDTH//2 - 380, center_y - 380, WIDTH//2 + 380, center_y + 380],
        fill=(248, 248, 248, 255)
    )
    
    # 3. Dynamic Statue Stage with Camera Zoom / Motion
    # Subtle camera zoom in (1.0 to 1.12 over 10 seconds) + gentle sinusoidal float
    zoom = 1.0 + 0.10 * progress
    float_y = math.sin(current_time * 2.0) * 8.0
    
    # Base statue size
    target_w = int(580 * zoom)
    target_h = int(870 * zoom)
    scaled_statue = ref_img.resize((target_w, target_h), Image.Resampling.LANCZOS)
    
    # Statue ground shadow
    shadow_w = int(380 * zoom)
    shadow_h = 24
    shadow_x = (WIDTH - shadow_w) // 2
    shadow_y = int(center_y + target_h // 2 - 40 + float_y)
    draw.ellipse(
        [shadow_x, shadow_y, shadow_x + shadow_w, shadow_y + shadow_h],
        fill=(225, 225, 225, 255)
    )
    
    # Paste statue with Multiply blend effect
    statue_x = (WIDTH - target_w) // 2
    statue_y = int(center_y - target_h // 2 + float_y)
    frame.paste(scaled_statue, (statue_x, statue_y), scaled_statue)
    
    # 4. Top Animated Progress Bar
    draw.rectangle([0, 0, WIDTH, 12], fill=(230, 230, 230, 255))
    bar_width = int(WIDTH * progress)
    if bar_width > 0:
        draw.rectangle([0, 0, bar_width, 12], fill=(0, 0, 0, 255))
        
    # 5. Top Header Pill & Category
    # Category Pill
    draw.rounded_rectangle([60, 48, 280, 96], radius=24, fill=(0, 0, 0, 255))
    draw.text((88, 59), "AUTONOMOUS", fill=(255, 255, 255, 255), font=FONT_HEADER)
    # Channel Tag
    draw.text((WIDTH - 280, 59), "#DAILY_INTEL", fill=(110, 110, 110, 255), font=FONT_HEADER)
    
    # 6. Headline Banner
    draw.text((60, 124), "WHY AUTONOMOUS PIPELINES", fill=(0, 0, 0, 255), font=FONT_HEADLINE)
    draw.text((60, 178), "ARE WINNING DIGITAL MEDIA", fill=(0, 0, 0, 255), font=FONT_HEADLINE)
    
    # 7. Scene Beat Info Cards
    if current_time < 3.4:
        card1 = {
            "badge": "PARADIGM SHIFT",
            "title": "Signal Over Noise",
            "subtitle": "Content saturation has reached critical inflection.",
            "height": 220
        }
        draw_info_card(draw, card1)
    elif current_time < 6.8:
        card2 = {
            "badge": "RETENTION BENCHMARK",
            "metric": "10x",
            "metric_label": "VELOCITY MULTIPLIER",
            "title": "Autonomous Efficiency",
            "height": 290
        }
        draw_info_card(draw, card2)
    else:
        card3 = {
            "badge": "STRATEGIC DIRECTIVE",
            "title": "Autonomous Moats",
            "bullets": [
                "Zero manual human editing required",
                "Self-healing content deduplication",
                "Instant multi-platform syndication"
            ],
            "height": 290
        }
        draw_info_card(draw, card3)
        
    # 8. High-Impact Kinetic Word Captions (Bottom Third)
    # Find active word
    active_idx = -1
    for idx, (word, start, end) in enumerate(WORDS_DATA):
        if start <= current_time <= end + 0.08:
            active_idx = idx
            break
            
    if active_idx == -1:
        # Fallback to closest previous word
        for idx, (word, start, end) in enumerate(WORDS_DATA):
            if start <= current_time:
                active_idx = idx
                
    if active_idx != -1:
        # Display window of 3 words centered around active word
        w_start = max(0, min(active_idx - 1, len(WORDS_DATA) - 3))
        chunk = WORDS_DATA[w_start:w_start + 3]
        
        caption_y = 1620
        # Calculate total width to center on screen
        total_w = 0
        word_widths = []
        for w, s, e in chunk:
            is_active = (w == WORDS_DATA[active_idx][0] and abs(s - WORDS_DATA[active_idx][1]) < 0.01)
            f = FONT_CAPTION
            length = draw.textlength(w.upper(), font=f)
            padding = 32 if is_active else 12
            full_w = length + padding
            word_widths.append((w, is_active, full_w, length))
            total_w += full_w + 16
            
        cur_x = (WIDTH - total_w) // 2
        for w, is_active, full_w, length in word_widths:
            if is_active:
                # High-contrast solid black badge for active spoken word
                draw.rounded_rectangle(
                    [cur_x, caption_y - 12, cur_x + full_w, caption_y + 60],
                    radius=10,
                    fill=(0, 0, 0, 255)
                )
                draw.text(
                    (cur_x + 16, caption_y - 2),
                    w.upper(),
                    fill=(255, 255, 255, 255),
                    font=FONT_CAPTION
                )
            else:
                draw.text(
                    (cur_x + 6, caption_y - 2),
                    w.upper(),
                    fill=(160, 160, 160, 255),
                    font=FONT_CAPTION
                )
            cur_x += full_w + 16
            
    return frame.convert("RGB")

def main():
    print(f"=== Rendering Sample Video ({TOTAL_FRAMES} frames @ {FPS} fps, 1080x1920) ===")
    print(f"Audio Track: {AUDIO_PATH}")
    print(f"Output Video: {OUTPUT_VIDEO_PATH}")
    
    # FFmpeg pipe process
    ffmpeg_cmd = [
        "ffmpeg",
        "-y",
        "-f", "rawvideo",
        "-vcodec", "rawvideo",
        "-s", f"{WIDTH}x{HEIGHT}",
        "-pix_fmt", "rgb24",
        "-r", str(FPS),
        "-i", "pipe:0",
        "-i", AUDIO_PATH,
        "-c:v", "libx264",
        "-preset", "fast",
        "-crf", "18",
        "-pix_fmt", "yuv420p",
        "-c:a", "aac",
        "-b:a", "192k",
        "-shortest",
        OUTPUT_VIDEO_PATH
    ]
    
    pipe = subprocess.Popen(ffmpeg_cmd, stdin=subprocess.PIPE, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)
    
    for f in range(TOTAL_FRAMES):
        if f % 30 == 0:
            print(f"Rendering frame {f}/{TOTAL_FRAMES} ({int(f/TOTAL_FRAMES*100)}%)...")
        frame_img = render_frame(f)
        pipe.stdin.write(frame_img.tobytes())
        
    pipe.stdin.close()
    pipe.wait()
    
    if pipe.returncode == 0:
        print(f"\nSUCCESS! Sample video generated at: {OUTPUT_VIDEO_PATH}")
        print(f"File size: {os.path.getsize(OUTPUT_VIDEO_PATH) / (1024*1024):.2f} MB")
    else:
        err = pipe.stderr.read().decode()
        print(f"FFmpeg error: {err}")
        sys.exit(1)

if __name__ == "__main__":
    main()
