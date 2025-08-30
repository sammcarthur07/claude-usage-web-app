# 🔑 How to Get Your Anthropic API Key

## **METHOD 1: Anthropic Console (Official)**

1. **Go to Anthropic Console:**
   - Visit: https://console.anthropic.com/
   - Sign in with: `mcarthur.sp@gmail.com` (your Claude account)

2. **Navigate to API Keys:**
   - Look for "API Keys" in the sidebar
   - Or go to Account Settings → API Keys

3. **Create or Find Your Key:**
   - Click "Create Key" if you don't have one
   - Or copy existing key starting with `sk-ant-api03-...`

4. **Use in Your PWA:**
   - Copy the full key: `sk-ant-api03-xxxxxxxxxxxxxxx`
   - Paste into your PWA login screen
   - Check "Remember me" to save securely

---

## **METHOD 2: Check Claude Code Credentials**

Your Claude Code might already have an API key configured:

### **Check Environment Variables:**
```bash
# Look for API key in environment
env | grep -i anthropic
env | grep -i claude
```

### **Check Claude Code Settings:**
```bash
# Check if API key is stored in settings
cat ~/.claude/settings.json 2>/dev/null | grep -i api
```

---

## **METHOD 3: Alternative - Use Mock Data First**

If you don't have an API key yet, you can still test your PWA:

### **Test with Mock Data:**
1. **Open your PWA:** https://sammcarthur07.github.io/claude-usage-web-app/
2. **Use test credentials:**
   - Email: `test@example.com`
   - API Key: `sk-ant-test123456789abcdefghijklmnop`
3. **Mock data will show:**
   - Realistic usage statistics
   - Chart visualizations
   - All PWA features working

---

## **CONNECTING TO YOUR REAL CLAUDE USAGE**

### **What You Need:**
- ✅ **Your Anthropic Account:** `mcarthur.sp@gmail.com` ✓
- ✅ **Organization:** "Sam" ✓  
- ❓ **API Key:** Get from console.anthropic.com

### **Expected Data Sources:**

**From Anthropic API:**
- Web chat usage (claude.ai)
- API calls from other apps
- Total token consumption
- Cost breakdown by model

**From Claude Code Logs:**
- Terminal/CLI usage
- Local development usage
- Session statistics

### **Usage Categories You'll See:**
```javascript
// Your real usage will show:
{
  totalTokens: [your actual usage],
  webTokens: [claude.ai usage], 
  terminalTokens: [claude code usage],
  opusCost: [Opus model costs],
  sonnetCost: [Sonnet model costs],
  apiCalls: [total API requests],
  dailyUsage: [...] // 7-day history
}
```

---

## **TROUBLESHOOTING**

### **Can't Find API Key?**
1. **Create New Key:**
   - console.anthropic.com → API Keys → Create Key
   - Name: "Claude Usage Monitor"
   - Copy the key immediately (shown once)

### **No Anthropic Console Access?**
1. **Check Account Type:**
   - Pro/Team accounts: Have API access
   - Free accounts: Limited API access
   - Contact Anthropic support if needed

### **Want to Test Without API Key?**
1. **Use Mock Mode:**
   - Your PWA has full mock data support
   - Test all features with fake realistic data
   - Switch to real API later

---

## **QUICK START**

**Fastest Path:**
1. **Get API Key:** console.anthropic.com → API Keys → Create
2. **Open PWA:** https://sammcarthur07.github.io/claude-usage-web-app/
3. **Login:** Use your email + API key
4. **View Stats:** Real Claude usage data loads

**Test Mode:**
1. **Open PWA:** https://sammcarthur07.github.io/claude-usage-web-app/
2. **Use Test Login:** test@example.com + sk-ant-test123456789abcdefghijklmnop
3. **Explore Features:** See how the app works with mock data