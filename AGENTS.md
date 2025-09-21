# AGENTS.md

This file provides guidance for AI Agents and MCP tools when working with the Remote Job Radar codebase.

## UI Component Registries

Remote Job Radar uses multiple premium UI component registries in addition to shadcn/ui. These registries provide enhanced, animated, and specialized components for building beautiful interfaces.

### Available Registries

#### 1. shadcn/ui (`@shadcn`)

- **URL**: https://ui.shadcn.com
- **Description**: The foundation UI library with excellent components
- **Usage**: Standard shadcn CLI commands
- **Examples**: `npx shadcn@latest add button`, `npx shadcn@latest add dialog`

#### 2. KokonutUI (`@kokonutui`)

- **URL**: https://kokonutui.com
- **Documentation**: https://kokonutui.com/docs
- **Description**: 70+ premium animated components with modern design
- **Specialties**: Text animations, interactive buttons, AI-themed components
- **Notable Components**:
  - `shimmer-text`: Animated text with shimmer effect
  - `profile-dropdown`: Enhanced user profile dropdown
  - `particle-button`: Interactive button with particle effects
  - `glitch-text`: Text with glitch animation effects
  - `gradient-button`: Premium gradient buttons

#### 3. SmoothUI (`@smoothui`)

- **URL**: https://smoothui.dev
- **Documentation**: https://smoothui.dev/doc
- **Description**: Components with smooth animations built with Framer Motion
- **Specialties**: Job listings, user management, smooth transitions
- **Notable Components**:
  - `job-listing-component`: Professional job card component
  - `user-account-avatar`: Interactive user avatar with dropdown
  - `animated-tags`: Tags with smooth animations
  - `dynamic-island`: macOS-style dynamic island component
  - `interactive-image-selector`: Advanced image selection component

#### 4. ReUI (`@reui`)

- **URL**: https://reui.io
- **Documentation**: https://reui.io/docs
- **Description**: 1,164+ components with copy-and-paste philosophy
- **Specialties**: Kanban boards, advanced UI blocks, data visualization
- **Notable Components**:
  - `kanban`: Professional kanban board component
  - `data-grid`: Advanced data table with sorting/filtering
  - `rating`: Star rating component with animations
  - `chart`: Various chart components for data visualization

#### 5. Motion Primitives (`@motion-primitives`)

- **URL**: https://motion-primitives.com
- **Documentation**: https://motion-primitives.com/docs
- **Description**: Beautiful animated components built with Framer Motion
- **Specialties**: Text effects, interactive elements, advanced animations
- **Notable Components**:
  - `text-shimmer`: Advanced text shimmer animations
  - `morphing-dialog`: Dialog with morphing transitions
  - `dock`: macOS-style dock component
  - `spotlight`: Spotlight hover effects
  - `magnetic`: Magnetic hover interactions

### Installation Methods

#### Method 1: Using shadcn CLI with Registry Names

```bash
# Install from specific registry
npx shadcn@latest add @kokonutui/shimmer-text
npx shadcn@latest add @smoothui/job-listing-component
npx shadcn@latest add @reui/kanban
```

#### Method 2: Direct URL Installation

```bash
# Install using direct JSON URLs
npx shadcn@latest add "https://kokonutui.com/r/shimmer-text.json"
npx shadcn@latest add "https://smoothui.dev/r/job-listing-component.json"
npx shadcn@latest add "https://reui.io/r/kanban.json"
```

#### Method 3: MCP Tool Usage

When using MCP tools, use the `call_mcp_tool` function:

```typescript
// Search for components
call_mcp_tool("search_items_in_registries", {
  query: "profile avatar",
  registries: ["@smoothui", "@kokonutui"],
});

// Get component examples
call_mcp_tool("get_item_examples_from_registries", {
  query: "job-listing-demo",
  registries: ["@smoothui"],
});

// View component details
call_mcp_tool("view_items_in_registries", {
  items: ["@kokonutui/shimmer-text", "@smoothui/user-account-avatar"],
});
```

### Component File Structure

Components are installed in organized directories:

```
components/
├── ui/                          # shadcn/ui components
├── kokonutui/                   # KokonutUI components
├── smoothui/ui/                 # SmoothUI components
├── reui/                        # ReUI components
└── motion-primitives/           # Motion Primitives components
```

### Registry Configuration

The `components.json` file in `apps/web/` configures all registries:

```json
{
  "registries": {
    "@smoothui": "https://smoothui.dev/r/{name}.json",
    "@kokonutui": "https://kokonutui.com/r/{name}.json",
    "@motion-primitives": "https://motion-primitives.com/r/{name}.json",
    "@reui": "https://reui.io/r/{name}.json",
    "@clerk": "https://clerk.com/r/{name}.json"
  }
}
```

## MCP Usage Guidelines

### When to Use Premium Registries

1. **KokonutUI**: Use for text animations, profile dropdowns, AI-themed components
2. **SmoothUI**: Use for job-related components, user management interfaces
3. **ReUI**: Use for kanban boards, data grids, complex UI layouts
4. **Motion Primitives**: Use for advanced animations and interactive elements

### Component Selection Priority

1. **Job Listings**: SmoothUI `job-listing-component`
2. **Kanban Boards**: ReUI `kanban`
3. **User Profiles**: SmoothUI `user-account-avatar`, KokonutUI `profile-dropdown`
4. **Text Effects**: KokonutUI `shimmer-text`, Motion Primitives `text-shimmer`
5. **Buttons**: KokonutUI `gradient-button`, `particle-button`
6. **Data Display**: ReUI `data-grid`, `chart`

### Integration Best Practices

1. **Import Consistency**: Always use the `@/components/[registry]/` path structure
2. **Type Safety**: Ensure components have proper TypeScript interfaces
3. **Theme Integration**: Verify components work with light/dark mode
4. **Performance**: Consider component bundle size and loading performance
5. **Accessibility**: Ensure components meet WCAG guidelines

### Example Usage in Code

```tsx
// KokonutUI Shimmer Text
import ShimmerText from "@/components/kokonutui/shimmer-text";

<ShimmerText
  text="Profile Dashboard"
  className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary"
/>;

// SmoothUI User Avatar
import UserAccountAvatar from "@/components/smoothui/ui/UserAccountAvatar";

<UserAccountAvatar
  user={{ name: "John Doe", email: "john@example.com", avatar: "..." }}
  className="hover:scale-110 transition-transform"
/>;

// ReUI Kanban Board
import { Kanban } from "@/components/ui/kanban";

<Kanban columns={kanbanColumns} onCardMove={handleCardMove} className="w-full h-full" />;
```

## AI Agent Guidelines

### Component Discovery

1. Always check multiple registries for similar components
2. Prioritize components that match the project's blue-purple gradient theme
3. Consider animation requirements and performance implications
4. Verify component compatibility with existing design system

### Implementation Steps

1. Search for relevant components using MCP tools
2. Install components using direct URL method for reliability
3. Import and implement with proper TypeScript interfaces
4. Test with project's color scheme and theme
5. Ensure responsive design and accessibility
6. Document component usage in relevant files

### Common Patterns

- Use premium registries for hero sections and landing pages
- Combine multiple registry components for complex interfaces
- Maintain consistency with existing component patterns
- Follow the project's animation and transition standards

This documentation should be referenced when building new features or enhancing existing UI components in Remote Job Radar.
