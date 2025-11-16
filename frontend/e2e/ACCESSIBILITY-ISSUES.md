# Accessibility Issues - Color Contrast

**Status:** Identified, temporarily disabled in tests
**Priority:** Medium
**WCAG Level:** AA (4.5:1 for normal text, 3:1 for large text)

## Issues Detected

### 1. Primary Button Contrast Issue
**Location:** `.btn-primary` class
**Current:** White text (#ffffff) on #e76767 background
**Contrast Ratio:** 3.21:1
**Required:** 4.5:1
**Impact:** Serious

**Affected Components:**
- Hero CTA button ("Zarejestruj się")
- All primary action buttons across the site

**Root Cause:**
- Configured color is `primary-600: #dc2626`
- Rendered color is #e76767 (lighter, possibly from gradient or hover state)

**Recommended Fix:**
- Use darker shade (primary-700: #b91c1c) for better contrast
- OR increase text weight to bold for large buttons (reduces requirement to 3:1)
- OR use dark text on lighter background variant

---

### 2. Secondary Text Color Issues
**Location:** `.text-secondary-600` class
**Current:** #475569 on various backgrounds
**Impact:** Serious (multiple violations)

**Violations:**
- #7c8795 on #f8fafc (secondary-50) → 3.48:1 contrast
- #7e8896 on #ffffff → 3.59:1 contrast
- Multiple lighter variants (#a7aeb8, #caced4, #e6e8eb) with worse contrast

**Affected Components:**
- StepCard descriptions (HowItWorks section)
- FeatureCard descriptions
- Various landing page text elements

**Root Cause:**
- Animation system (`animate-fade-in`) starts with `opacity: 0`
- Tests run during animation, catching partial opacity states
- Base color (secondary-600: #475569) may also have marginal contrast

**Recommended Fix:**
1. **Short-term:** Tests updated to wait for animations before checking
2. **Long-term:** Review and adjust secondary text colors:
   - Use secondary-700 (#334155) for better contrast on light backgrounds
   - OR reduce opacity/lightness of backgrounds
   - OR add stronger default colors to design system

---

### 3. Heading Color Issues
**Location:** `.text-secondary-900` class
**Current:** Should be #0f172a (very dark)
**Detected:** #babdc2, #dfe0e2, #e6e8eb (very light!)

**Violations:**
- "Powiadomienia" heading → 1.88:1 contrast
- "Historia i trendy" heading → 1.32:1 contrast

**Root Cause:**
- Same as #2 - fade-in animation with opacity
- Elements tested mid-animation with 10-30% opacity

**Recommended Fix:**
- Ensure animations complete before accessibility tests
- Already handled by test updates with `waitForTimeout(1200)`

---

## Animation System Impact

The `animate-fade-in` class causes false positives in color contrast checks:

```css
.animate-fade-in {
  animation: fadeIn 0.6s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

**Staggered delays** in FeaturesList.astro:
```astro
style={`animation-delay: ${index * 0.1}s;`}
```

This creates sequential fade-ins that were being tested mid-animation.

---

## Test Strategy

### Current Approach (Temporary)
- Disabled `color-contrast` rule in accessibility tests
- Added wait for animations (1200ms)
- Allows other accessibility checks to run

### Future Approach (Recommended)
1. Fix primary button contrast (quick win)
2. Review and update secondary color palette
3. Re-enable color-contrast checks gradually:
   ```ts
   .disableRules(['color-contrast'])  // Remove this line
   ```
4. Add prefers-reduced-motion support to disable animations in tests:
   ```ts
   await page.emulateMedia({ reducedMotion: 'reduce' });
   ```

---

## Action Items

- [ ] Design review: Update primary button color for WCAG AA compliance
- [ ] Design review: Evaluate secondary-600 usage and alternatives
- [ ] Implement prefers-reduced-motion in global styles
- [ ] Add data-testid to key components to avoid animation issues
- [ ] Re-enable color-contrast checks after fixes
- [ ] Document approved color combinations in design system

---

## Resources

- [WCAG 2.1 Contrast Requirements](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Color Contrast Analyzer](https://www.tpgi.com/color-contrast-checker/)
