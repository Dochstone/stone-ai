# Промпты для картинок — «Один промпт»

Единый промпт для всех 6 картинок (как у Google — один текст, разные результаты):

**ПРОМПТ НА ЭКРАНЕ (показывается зрителю):**
```
Военная колонна на рассвете, кинематографичный свет, фотореализм
```

Этот текст видно в поле ввода Stone AI в первые 4 секунды ролика.

---

## 6 картинок — каждая от разной модели

Генерировать через OpenAI DALL-E 3 (HD, 1792x1024, style: natural).

### Кадр 1 (0:04–0:06) — Flux Schnell
```
Documentary war photography: Russian T-90M tank column advancing through morning mist on muddy road at golden sunrise, realistic EMR digital flora camouflage, volumetric fog, dramatic god rays, Canon EOS R5 telephoto 200mm, natural colors, photojournalism style
```
Подпись: `Flux Schnell`

### Кадр 2 (0:06–0:08) — GPT-5 Image
```
Photorealistic military field camp at dawn, Russian soldiers in modern Ratnik gear near BTR-82A, morning fog between olive tents, warm campfire glow, atmospheric perspective, documentary photography, shot on Nikon D6, available light
```
Подпись: `GPT-5 Image`

### Кадр 3 (0:08–0:10) — Stable Diffusion XL
```
Night vision aesthetic: Russian special forces operators in Ratnik 3 combat suits patrolling dark urban environment, green NVG glow mixed with moonlight, AK-12 rifles with tactical accessories, high ISO grain, documentary war photography
```
Подпись: `Stable Diffusion`

### Кадр 4 (0:10–0:12) — Nano Banana Pro
```
Cinematic aerial drone photograph: Russian Mi-28N Night Hunter attack helicopter flying low over misty mountain valley at sunrise, realistic rotor motion blur, military green camouflage paint, golden god rays through fog, telephoto 600mm from ground level
```
Подпись: `Nano Banana Pro`

### Кадр 5 (0:12–0:13.5) — Flux Schnell
```
War correspondent close-up: Russian military convoy of BTR-82A armored vehicles on highway at golden hour, soldiers in 6B47 helmets in hatches, road dust clouds, dramatic warm side lighting, telephoto compression, authentic documentary journalism
```
Подпись: `Flux Schnell`

### Кадр 6 (0:13.5–0:16) — GPT-5 Image
```
Dramatic silhouette composition: Russian artillery crew at sunset, massive smoke cloud rising behind howitzer, soldiers working in coordinated motion, extreme backlight from setting sun, golden dust particles, epic war photography, Pulitzer style
```
Подпись: `GPT-5 Image`

---

## Инструкции

Используй OpenAI API (DALL-E 3) с параметрами:
- size: `1792x1024` (широкий кинематографичный формат)
- quality: `hd`
- style: `natural` (не vivid — нужен фотореализм)

Для VK Shorts (9:16) при монтаже кропнуть в вертикаль с Ken Burns (медленный zoom/pan).
