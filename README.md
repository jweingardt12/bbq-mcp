# 🍖 BBQ MCP Server

[![smithery badge](https://smithery.ai/badge/@jweingardt12/bbq-mcp)](https://smithery.ai/server/@jweingardt12/bbq-mcp)

An MCP (Model Context Protocol) server for BBQ cooking guidance with **live ThermoWorks Cloud integration**. Connect your ThermoWorks account to get real-time temperature readings, expert cooking guidance, stall detection, and perfectly timed cooks.

## ✨ What's New: Real ThermoWorks Authentication

**Connect your actual ThermoWorks devices!** This MCP server now authenticates directly with ThermoWorks Cloud using your existing account credentials (same as the ThermoWorks mobile app).

```
You: "Connect to my ThermoWorks account"
MCP: thermoworks_authenticate(email, password)
→ ✅ Connected! Found 1 device: Signals (SIG-12345)

You: "How's my brisket doing?"  
MCP: thermoworks_get_live_readings() + bbq_analyze_temperature()
→ 🌡️ Probe 1: 168°F | Target: 203°F | 78% complete
→ ⚠️ You're in the stall zone! Consider wrapping.
```

## Features

- **📱 ThermoWorks Cloud Integration**: Live readings from Signals, Smoke, BlueDOT, Node
- **🎯 Cooking Guidance**: Comprehensive instructions for 20+ proteins
- **🌡️ Temperature Analysis**: Real-time progress tracking with trend detection
- **⏱️ Time Estimation**: Accurate cook times based on weight and method
- **🛑 Stall Detection**: Detect and get recommendations for the dreaded stall
- **😴 Rest Calculations**: Know exactly when to pull and how long to rest

## Supported Proteins

### Beef
- Brisket, Ribeye, Tri-Tip, Prime Rib, Short Ribs

### Pork
- Shoulder, Butt, Spare Ribs, Baby Back Ribs, Loin, Tenderloin, Belly

### Poultry
- Whole Chicken, Breast, Thighs, Wings, Whole Turkey, Turkey Breast

### Lamb
- Shoulder, Leg, Rack

### Seafood
- Salmon

## Cooking Methods

| Method | Temperature Range | Best For |
|--------|------------------|----------|
| Low & Slow Smoke | 225-250°F | Brisket, Pork Butt, Ribs |
| Hot & Fast Smoke | 275-325°F | Poultry, Pork Loin |
| Direct Grilling | 400-500°F | Steaks, Chops |
| Indirect Grilling | 300-350°F | Roasts, Larger Cuts |
| Reverse Sear | 225°F → 500°F | Thick Steaks |
| Spatchcock | 325-400°F | Whole Birds |
| Rotisserie | 300-350°F | Whole Birds, Roasts |

## Installation

### Local Installation

```bash
# Clone or copy the server files
cd bbq-mcp-server

# Install dependencies
npm install

# Build
npm run build

# Run (stdio mode for local use)
npm start

# Run (HTTP mode for remote access)
TRANSPORT=http npm start
```

### Deploy to Smithery

This server is designed to work with [Smithery](https://smithery.ai) for hosted deployment. Smithery handles containerization and scaling automatically.

**1. Push to GitHub**

```bash
git init
git add .
git commit -m "BBQ MCP Server"
git remote add origin https://github.com/YOUR_USERNAME/bbq-mcp-server.git
git push -u origin main
```

**2. Connect to Smithery**

1. Go to [smithery.ai](https://smithery.ai) and sign in
2. Click "Add Server" and connect your GitHub repository
3. Smithery will auto-detect the `smithery.yaml` and `package.json` configuration
4. Click "Deploy"

**3. Configure Session**

When users connect to your server on Smithery, they can provide their ThermoWorks credentials via session configuration:

| Parameter | Description |
|-----------|-------------|
| `thermoworks_email` | ThermoWorks account email (optional) |
| `thermoworks_password` | ThermoWorks account password (optional) |
| `use_legacy_smoke` | Set `true` for older Smoke Gateway devices |

Users who don't provide credentials can still use all BBQ cooking guidance tools - only the live device reading tools require authentication.

**4. Local Development with Smithery CLI**

```bash
# Install Smithery CLI
npm install -D @smithery/cli

# Start development server with hot reload
npm run dev

# This opens the Smithery Playground for testing
```

## ThermoWorks Cloud Authentication

### Connecting Your Account

The MCP server authenticates directly with ThermoWorks Cloud (Firebase backend). Your credentials are sent directly to ThermoWorks servers and are never stored.

```json
{
  "tool": "thermoworks_authenticate",
  "args": {
    "email": "your-thermoworks-email@example.com",
    "password": "your-password"
  }
}
```

### For Automated/Headless Use

Set environment variables:

```bash
export THERMOWORKS_EMAIL="your-email@example.com"
export THERMOWORKS_PASSWORD="your-password"
```

### Security Notes

- ✅ Credentials sent directly to ThermoWorks/Firebase (HTTPS)
- ✅ No credentials stored by the MCP server
- ✅ Tokens auto-expire after 1 hour
- ✅ Tokens auto-refresh when needed
- ⚠️ Use environment variables in production, never hardcode credentials

## Available Tools

### ThermoWorks Cloud Tools

#### `thermoworks_authenticate`
Connect to ThermoWorks Cloud with your account.

```json
{
  "email": "your@email.com",
  "password": "your-password",
  "use_legacy_smoke": false
}
```

#### `thermoworks_get_live_readings`
Get current temperature readings from all connected devices.

```json
{
  "device_serial": "SIG-12345",  // optional, defaults to all
  "response_format": "markdown"
}
```

#### `thermoworks_analyze_live`
Get live reading and analyze against cooking targets.

```json
{
  "device_serial": "SIG-12345",
  "probe_id": "1",
  "protein_type": "beef_brisket"
}
```

### BBQ Cooking Tools

#### `bbq_get_cooking_guidance`
Get comprehensive cooking guidance for a specific protein.

```json
{
  "protein_type": "beef_brisket",
  "weight_pounds": 14,
  "serving_time": "2024-12-25T18:00:00"
}
```

### `bbq_analyze_temperature`
Analyze current temperature and get progress/recommendations.

```json
{
  "current_temp": 165,
  "target_temp": 203,
  "protein_type": "beef_brisket",
  "previous_readings": [
    {"temp": 155, "timestamp": "2024-12-25T10:00:00"},
    {"temp": 160, "timestamp": "2024-12-25T11:00:00"},
    {"temp": 165, "timestamp": "2024-12-25T12:00:00"}
  ]
}
```

### `bbq_get_target_temperature`
Get target temperature for a protein at specified doneness.

```json
{
  "protein_type": "beef_ribeye",
  "doneness": "medium_rare"
}
```

### `bbq_list_proteins`
List all supported proteins and their cooking info.

```json
{
  "category": "beef"
}
```

### `bbq_estimate_cook_time`
Estimate total cooking time.

```json
{
  "protein_type": "pork_butt",
  "weight_pounds": 10,
  "cook_method": "smoke_low_slow"
}
```

### `bbq_detect_stall`
Detect if your cook is experiencing a temperature stall.

```json
{
  "protein_type": "beef_brisket",
  "current_temp": 160,
  "readings": [
    {"temp": 158, "timestamp": "2024-12-25T10:00:00"},
    {"temp": 159, "timestamp": "2024-12-25T11:00:00"},
    {"temp": 160, "timestamp": "2024-12-25T12:00:00"},
    {"temp": 160, "timestamp": "2024-12-25T13:00:00"}
  ]
}
```

### `bbq_get_cooking_tips`
Get cooking tips for a protein and cooking phase.

```json
{
  "protein_type": "beef_brisket",
  "current_phase": "stall"
}
```

### `bbq_calculate_rest_time`
Calculate rest time and carryover cooking.

```json
{
  "protein_type": "beef_brisket",
  "current_temp": 200
}
```

### `bbq_analyze_device_reading`
Analyze readings from a ThermoWorks device.

```json
{
  "device_type": "Signals",
  "probe_readings": [
    {"probe_id": "probe1", "name": "Brisket", "temperature": 175},
    {"probe_id": "ambient", "name": "Smoker", "temperature": 250}
  ],
  "protein_type": "beef_brisket",
  "target_temp": 203
}
```

### `bbq_convert_temperature`
Convert between Fahrenheit and Celsius.

```json
{
  "temperature": 225,
  "from_unit": "fahrenheit",
  "to_unit": "celsius"
}
```

## Example Usage

### Planning a Brisket Cook

> "I have a 14 lb brisket and want to serve dinner at 6 PM. When should I start?"

The server will calculate:
- Estimated cook time (~17-18 hours for low & slow)
- Recommended start time (accounting for rest and buffer)
- Target temperatures
- Stall warnings
- Resting instructions

### Monitoring Progress

> "My brisket is at 165°F and hasn't moved in 2 hours. Is this normal?"

The server will:
- Detect the stall
- Confirm this is normal behavior
- Provide recommendations (wrap or ride it out)
- Estimate remaining time

### Getting to the Finish Line

> "Brisket just hit 200°F. How long should I rest it?"

The server will:
- Recommend 60+ minute rest
- Calculate expected carryover (+5°F)
- Provide resting instructions
- Suggest cooler method for extended holding

## ThermoWorks Integration

This server is designed to work with ThermoWorks Cloud-connected devices:

- **Signals**: 4-probe thermometer with Billows fan control
- **Smoke**: 2-probe wireless thermometer with gateway
- **BlueDOT**: Bluetooth thermometer with app connectivity

While full API integration requires ThermoWorks Cloud credentials, the server can analyze temperature readings provided by users and simulate device workflows.

## Temperature Guidelines (USDA)

| Protein | Safe Minimum | Recommended |
|---------|-------------|-------------|
| Beef (whole cuts) | 145°F + 3 min rest | Medium-rare: 130°F |
| Pork (whole cuts) | 145°F + 3 min rest | Medium: 145°F |
| Ground meats | 160°F | 160°F |
| Poultry | 165°F | Breast: 165°F, Thigh: 175°F |
| Brisket/Pulled Pork | 145°F safe | Pullable: 200-205°F |

## License

MIT

## Smithery Deployment

This server is compatible with [Smithery](https://smithery.ai) for hosted deployment.

### Quick Deploy

1. Push to a GitHub repository
2. Connect to Smithery and import your repo
3. Smithery will detect `smithery.yaml` and deploy automatically

### Configuration Schema

When users connect, they can optionally provide:

| Parameter | Type | Description |
|-----------|------|-------------|
| `thermoworksEmail` | string | ThermoWorks account email |
| `thermoworksPassword` | string | ThermoWorks account password |
| `useLegacySmoke` | boolean | Use legacy Smoke Gateway API |
| `defaultTempUnit` | enum | "fahrenheit" or "celsius" |

### Local Development with Smithery CLI

```bash
# Install Smithery CLI
npm install -g @smithery/cli

# Run dev server with hot-reload
npm run dev

# Or run playground
npx @smithery/cli playground
```

### Files for Smithery

- `smithery.yaml` - Smithery configuration
- `src/smithery.ts` - Smithery-compatible entry point with `configSchema` export

## Contributing

Contributions welcome! Areas of interest:
- Additional protein profiles
- Regional BBQ style variations
- Enhanced ThermoWorks Cloud integration
- Smoker/grill-specific recommendations