# Design Researcher Resources

## Role
You are a Design Research Expert specializing in user research, design thinking, trend analysis, and evidence-based design.

## Key Knowledge Areas
- User research methodologies
- Design thinking and innovation frameworks
- Trend forecasting and analysis
- Competitive research and benchmarking
- Ethnographic studies
- Usability testing and evaluation
- Data analysis and synthesis
- Design validation methods

## Research Methods
### Qualitative Research
- User interviews
- Contextual inquiry
- Diary studies
- Focus groups
- Observational studies
- Card sorting
- Journey mapping

### Quantitative Research
- Surveys and questionnaires
- Analytics and metrics
- A/B testing
- Eye tracking
- Usability testing with metrics
- Market analysis

### Design Frameworks
- Double Diamond (Discover, Define, Develop, Deliver)
- Design Sprint methodology
- Jobs to Be Done (JTBD)
- Service Design Blueprint
- Experience mapping

## Trend Analysis Areas
### Technology Trends
- Emerging technologies
- Digital transformation
- IoT and connectivity
- AI and automation
- Sustainability tech

### Design Trends
- Material innovation
- Form language evolution
- Color and finish trends
- User interface patterns
- Interaction paradigms

### Market Trends
- Consumer behavior shifts
- Industry disruption
- Regulatory changes
- Demographic changes
- Economic factors

## Analysis Framework
When conducting research, consider:
1. User needs and pain points
2. Market gaps and opportunities
3. Competitive landscape
4. Technical feasibility
5. Business viability
6. Desirability factors
7. Cultural and social context

Add your specific research data, findings, and references below:
---
Affordances and perceived affordances
Affordance (ecological origin): what the environment offers the organism; it is relational (depends on the actor’s body and capabilities), not merely a property label. Gibson emphasizes affordances “point two ways, to the environment and to the observer.” 

Affordance (design usage, Norman): the range of possible actions; crucially, in physical product design there are real and perceived affordances, and they can differ. 

Perceived affordance (Norman framing): what the user believes they can do, based on cues; Norman stresses that in screen-based interfaces, designers mainly control perceived affordances, not physical ones. 

Example: a sturdy horizontal bar affords pulling in a physical sense and commonly signals “pull.” Counterexample: a decorative pull handle mounted on the push side of a door creates a perceived affordance that conflicts with the required action (classic “Norman door” failure). 

Signifiers
Signifier (Norman): perceptible signals that specify how people discover possible actions; in the revised edition Norman calls signifiers a key addition and argues they matter more to designers than affordances. 

Example: a push plate on a door, a raised button shape, a highlighted tappable card, a click sound when a latch engages. Counterexample: a flat glass surface with no visible cue to swipe vs tap, forcing guessing. Norman explicitly warns that confusing affordance talk in virtual design is often really about signifiers and conventions. 

Discoverability
Discoverability (Norman): the ease with which users can determine what actions are possible and what the current state is, without external instruction. Norman links discoverability to signifiers that reveal possibilities. 

Example: stove controls arranged in the same spatial layout as burners (users “see” what knob matches what burner). Counterexample: identical knobs in a row controlling burners arranged as a rectangle, requiring trial-and-error or memorization. 

Mapping and natural mapping
Mapping (Norman): the relationship between controls and their effects; “natural mapping” leverages spatial analogy so the mapping is obvious. 

Example: a floor-plan light switch panel where switch positions match room lights, including a “You are here” orientation mark. 

Counterexample: a one-dimensional switch array controlling lights distributed on a ceiling plane (users often flip all switches). 

Cultural caveat: Norman adds explicit discussion that what feels “natural” can vary across cultures, including culturally different representations of time. 

Feedback and visibility of system status
Feedback (Norman-compatible): information returned to the user about the effect of actions and the current system state; timely and continuous feedback reduces the gulf of evaluation. This aligns with Nielsen’s “Visibility of System Status” heuristic: keep users informed via appropriate feedback within reasonable time. 

Example: a power tool with an unmistakable on-state indicator and audible/visual confirmation on activation. Counterexample: a subtle mode indicator that trained operators routinely miss, leading to mode errors and accidents. 

Constraints
Constraint (Norman): reducing the possible actions so incorrect operations are blocked or less likely; constraints help users determine the correct action even in unfamiliar situations. 

Norman’s chapter explicitly enumerates four kinds of constraints (physical, cultural, semantic, logical). 
 Definitions below use a combination of Norman’s writings and university teaching materials grounded in his framework.

Physical constraints: properties of the physical world make some actions impossible (eg, geometry, reach, keyed shapes). 

Example: a USB-C connector shape limiting insertion orientation (partially); a battery compartment keyed so the battery only fits correctly.
Counterexample: identical valves/connectors that can be swapped, enabling catastrophic assembly errors.

Cultural constraints: shared conventions learned in a group (eg, scroll bar location, traffic signs). Norman calls scrolling conventions cultural constraints; they are arbitrary but powerful once standardized. 

Example: red means stop/danger in many contexts; standardized labeling.
Counterexample: reversing a widely learned gesture or icon without transitional cues.

Semantic constraints: meaning of the situation suggests what makes sense (world knowledge and context). 

Example: on a motorcycle, the rider seat and forward-facing controls imply where and how to sit (contextual meaning). 

Counterexample: a control that is physically reachable but semantically nonsensical in context, encouraging confusion (“Why would this knob be here?”).

Logical constraints: reasoning about relationships narrows the possibilities (often supported by natural mapping). Norman gives a simple logical constraint example: if you must select 5 items but only 4 are visible, you infer one remains elsewhere. 

Counterexample: inconsistent relationships where reasoning fails (users can’t infer the “fifth control” location).

Forcing functions: special constraints that prevent error by forcing correct sequencing or blocking unsafe states (interlocks, lock-ins, lock-outs). Norman expands forcing functions in the revised edition and discusses lock-in/lock-out explicitly. 

Conceptual models, mental models, and the system image
Designer’s model / user’s model / system image triad (Norman): designers intend a model; users form a mental model; communication happens through the “system image,” meaning the artifact and its explanatory materials. 

Conceptual model (Norman 1983): an invented, structured representation intended to be accurate/consistent/complete, produced by designers/teachers/engineers. 

Mental model (Norman 1983): what people actually form through interaction; can be incomplete and unstable. Norman lists observations such as “mental models are incomplete” and “unstable,” and that people’s ability to “run” their models is limited. 

Training implication: when users “do weird things,” assume they are rational under their (possibly wrong) mental model. The design task is to reshape the system image so the user’s model converges. 

Errors: slips, mistakes, modes, and systemic failures
Slip vs mistake: Nielsen Norman Group summarizes a Norman-compatible distinction: slips are unconscious errors from inattention; mistakes are conscious errors from a mismatch between the user’s mental model and the design. 
 Norman notes he updated error classifications in the revised edition, explicitly distinguishing slip types and mistake types. 

Mode error risk: Norman gives safety incidents where mode was signaled too subtly for trained crews to notice and argues human factors guidance often recommends avoiding unnecessary modes; when modes exist, mode status must be clear. 

Swiss cheese model (Reason): accidents emerge when multiple layers of defense have weaknesses that align; front-line operators are rarely the sole instigators of system breakdown. 

Automation irony (Bainbridge): automation can reduce practice and feedback, degrading human ability to intervene during rare but critical abnormal conditions. 

Resilience engineering (Hollnagel): a safety approach emphasizing systems’ capacity to respond, monitor, anticipate, and learn under variability, rather than assuming perfectly stable conditions. 

Crosswalk to established usability heuristics and HCD standards
DOET → Nielsen Norman Group heuristics: DOET’s feedback/state visibility maps cleanly onto “Visibility of System Status”; memory limits and knowledge-in-the-world align with “Recognition Rather Than Recall”; slips/mistakes and constraints align with “Error Prevention” and “User Control and Freedom.” 

HCD process grounding: ISO’s human-centered design framing is widely adopted; NIST quotes ISO’s definition emphasizing usability by focusing on users, needs, and human factors knowledge. 

Practical patterns, rules, and decision tools
This is the quick-reference layer the chatbot should output by default: crisp rules, then a decision tree to pick the right rule.

Quick-reference rules the chatbot can recommend
Rules for discoverability and action selection

Prefer signifiers over instructions. If you need a “PUSH” sign, your door is already telling the wrong story. 
Make the correct action the easiest action: reduce choices, then highlight what remains (constraints + signifiers). 
Align control layout with effect layout (natural mapping). If spatial mapping is impossible, add strong labeling and grouping, then user test. 
Show state continuously, not only after failure. Visibility builds trust and reduces repeated errors. 
Design the system image to teach the conceptual model: communicate “why,” not just “what.” 
Rules for constraints and forcing functions

Use physical constraints for safety-critical wrong actions (keying, interlocks). 
Use forcing functions sparingly: lock-outs and lock-ins can prevent harm but can also create anger and workarounds; make the reason visible. 
Treat conventions as constraints: breaking conventions costs users relearning time and invites mistakes. 
Rules for error handling

Prevent high-cost errors first (guard rails before polish). 
Diagnose slip vs mistake: slips get constraints and better feedback; mistakes get conceptual-model clarity and reduced assumptions. 
Avoid modes when you can; when you can’t, make mode status loud and persistent (not a tiny icon). 


Principle-by-principle training cards for all principles
Format per principle: Definition (original wording); Key insights; Industrial/product implications; Common examples; Pitfalls; Heuristic; Training Q&A/prompts (3 short items).

80/20 Rule
Def: A small subset of variables usually drives most outcomes in large systems. Key: Prioritize leverage points, not averages. Industrial: Put tolerance/tooling, UI simplicity, and durability into the most-used and most-failing parts. Examples: Power/volume on remotes; gasket preventing most leaks. Pitfalls: Ignoring “tail” users with high harm risk. Heuristic: Fix top 3 failure modes before adding features. Train: Q: “What 20% tasks dominate use?” A: “Observe + rank by frequency/importance.” Q: “Where does 80% of cost come from?” A: “Map BOM/service drivers.” Prompt: “List the top 5 user jobs, then circle 2.” 

Accessibility
Def: Design so people with varied abilities can use the product without special-case workarounds. Key: Accessible often equals better for everyone. Industrial: Provide tactile+visual redundancies, reach/force limits, clear labeling, and non-audio-only alerts. Examples: High-contrast markings; OXO Good Grips style handles. Pitfalls: “Add-on” accessibility late in tooling. Heuristic: Design for weakest reasonable capability first. Train: Q: “Which impairments matter here?” A: “Vision, hearing, dexterity, cognition.” Q: “Is any critical info color-only?” A: “If yes, add a second channel.” Prompt: “Describe use with gloves/low vision.” 

Advance Organizer
Def: Provide an up-front mental map that tells users what they’ll learn or do next. Key: Reduces confusion by setting structure before details. Industrial: Use quick-start cards, exploded diagrams, or step labels that preview the journey. Examples: IKEA “overview” panel; appliance quick-start sticker. Pitfalls: Overly abstract “marketing” overview. Heuristic: Show the end state and the steps. Train: Q: “What are the steps at a glance?” A: “Name 3–7 stages.” Q: “What’s the success picture?” A: “Show the assembled/ready state.” Prompt: “Write the ‘what you’ll do’ card.” 

Aesthetic-Usability Effect
Def: People often judge attractive designs as easier to use and more trustworthy before proof. Key: Visual polish can mask issues, so test carefully. Industrial: Use form/CMF to signal quality and reduce perceived effort, but validate with task data. Examples: Premium fit lines on consumer electronics; clean medical device UI. Pitfalls: Relying on “pretty” as a substitute for clarity. Heuristic: Beauty buys patience, not competence. Train: Q: “Will aesthetics hide usability bugs?” A: “Run blinded usability comparisons.” Q: “What must look safe/precise?” A: “Controls, connectors, warnings.” Prompt: “Separate ‘appeal’ tests from ‘task success’ tests.” 

Affordance
Def: A feature’s shape and cues imply how it can be used. Key: Good affordances reduce instructions. Industrial: Make grasp points graspable, press points pressable, and connectors self-keying. Examples: Pull handles vs push plates; keyed plugs. Pitfalls: “False affordances” that invite wrong actions. Heuristic: If it looks like a button, it must behave like one. Train: Q: “What action does this form suggest?” A: “Name the action in a verb.” Q: “Could it be misused?” A: “List top 3 wrong actions.” Prompt: “Describe the first-touch behavior.” 

Alignment
Def: Arrange elements so relationships are visually and physically coherent. Key: Alignment reduces search and raises perceived quality. Industrial: Align seams, fasteners, icons, and control groupings to support scanning and assembly. Examples: Control panel grids; aligned screw patterns. Pitfalls: Over-alignment that hides hierarchy. Heuristic: Align to support meaning, not just neatness. Train: Q: “What should read as a group?” A: “Align within group; separate across groups.” Q: “Where do tolerances break alignment?” A: “Specify datums and stack-ups.” Prompt: “Mark the primary alignment axis.” 

Anthropomorphic Form
Def: Humanlike cues in objects shape emotion, trust, and expectations. Key: Faces trigger social interpretation automatically. Industrial: Use “friendly” cues for helpers; avoid them for dangerous machines unless controlled. Examples: Robot eyes; car “face” grilles. Pitfalls: Creepy or misleading intent cues. Heuristic: Anthropomorphism amplifies emotional stakes. Train: Q: “What personality does it project?” A: “List 3 traits users might infer.” Q: “Does ‘cute’ reduce perceived risk?” A: “Add explicit safety cues.” Prompt: “Rate humanlikeness vs function.” 

Archetypes
Def: Familiar story-patterns and “types” help users predict meaning fast. Key: Archetypes shortcut explanation through shared culture. Industrial: Map product roles to known types (tool, companion, guardian, minimalist). Examples: “Swiss Army” multi-tool; “professional” black equipment. Pitfalls: Archetype mismatch with brand promise. Heuristic: Choose one primary archetype, then support it consistently. Train: Q: “What known category does it borrow from?” A: “Name closest mental category.” Q: “What must never contradict the archetype?” A: “Core cues (materials, form, voice).” Prompt: “State the archetype in one word.” 

Area Alignment
Def: Use shared edges and equal spacing so regions read as intentional units. Key: People read area boundaries as meaning. Industrial: In displays/panels, keep margins consistent; in enclosures, balance mass and seam spacing. Examples: Car dashboard zones; consistent label blocks. Pitfalls: Equal spacing that ignores ergonomics. Heuristic: Equalize spacing within “same” importance tiers. Train: Q: “Which areas must feel related?” A: “Align their boundaries.” Q: “Where does hand reach override geometry?” A: “Prioritize reach then re-balance layout.” Prompt: “Sketch the spacing system.” 

Attractiveness Bias
Def: We tend to attribute positive traits to attractive people or objects beyond evidence. Key: “Looks good” becomes “is good” in perception. Industrial: Use good finish cues ethically to communicate real quality; avoid “pretty but fragile” betrayal. Examples: Clean chamfers implying precision; meticulous packaging. Pitfalls: Overpromising; trust collapse after failure. Heuristic: Align perceived quality with actual reliability. Train: Q: “What virtue does this look imply?” A: “Durable, precise, safe, premium.” Q: “Can engineering back the promise?” A: “Test to match cues.” Prompt: “List cues that signal ‘cheap’ or ‘solid’.” 

Baby-Face Bias
Def: Babyish facial cues often trigger assumptions of warmth/naivety and lower dominance. Key: “Cute” changes perceived competence and threat. Industrial: For characters/robots/mascots, tune facial proportions to intended trust vs authority. Examples: Rounded “assistant” robot; toy design. Pitfalls: Undermining seriousness (medical, security). Heuristic: Use babyish cues for approachability, not capability claims. Train: Q: “Should it feel friendly or authoritative?” A: “Adjust ‘babyish’ features accordingly.” Q: “Does it reduce perceived risk too much?” A: “Reintroduce explicit warnings.” Prompt: “Describe intended social role.” 

Biophilia Effect
Def: Many people show a systematic preference for cues of living systems and nature. Key: Nature views/materials can improve comfort and perceived wellbeing. Industrial: Use natural materials, fractal-like textures, and daylight cues where appropriate; avoid “fake nature” that reads as gimmick. Examples: Wood touchpoints; plant-viewing in interiors. Pitfalls: Maintenance burden (real plants) or “stage set” feel. Heuristic: Use authentic materials or honest simulation. Train: Q: “Where can nature cues reduce stress?” A: “Primary contact surfaces and waiting areas.” Q: “Is this durable/sanitary?” A: “Match material to hygiene demands.” Prompt: “List 3 ‘nature cues’ allowed by constraints.” 

Cathedral Effect
Def: Higher perceived ceilings can bias thinking toward more abstract, relational processing; lower ceilings toward detail focus. Key: Space dimensions prime cognitive mode. Industrial: For creative ideation rooms show “height/open”; for inspection/precision tasks use “lower/contained” cues. Examples: High-ceiling atriums for exhibits; low-ceiling labs for focus. Pitfalls: Assuming “higher is always better.” Heuristic: Match volumetric feel to task type. Train: Q: “Is the task creative or analytical?” A: “Prime space accordingly.” Q: “How to fake height cost-effectively?” A: “Lighting, vertical lines, openness.” Prompt: “Choose ‘freedom’ vs ‘focus’ cues.” 

Chunking
Def: Break information or actions into small, meaningful units. Key: Working memory is limited; grouping boosts performance. Industrial: Use grouped steps, modular subassemblies, and control clusters. Examples: Phone numbers grouped; staged assembly instructions. Pitfalls: Arbitrary chunking that hides dependencies. Heuristic: 3–7 chunks per stage, each named. Train: Q: “What is the natural grouping?” A: “By task goal or subsystem.” Q: “Where do users pause?” A: “Insert chunk boundary there.” Prompt: “Rename each chunk with a verb.” 

Classical Conditioning
Def: Repeated pairing makes neutral cues trigger emotional/behavioral responses. Key: Context and cues can “train” expectations without words. Industrial: Use consistent startup sounds/lights to signal readiness; reinforce safe habits. Examples: Seatbelt chime; power-on animation. Pitfalls: Training harmful complacency. Heuristic: Pair critical safety states with unmistakable cues. Train: Q: “What cue signals ‘safe to proceed’?” A: “Consistent light/sound/haptic.” Q: “Can cues be confused?” A: “Differentiate by modality pattern.” Prompt: “Map cue → state → user response.” 

Closure
Def: People complete incomplete shapes/patterns into perceived wholes. Key: Minimal cues can imply structure. Industrial: Use partial outlines/icons; simplify graphics while preserving recognizability. Examples: Logo marks; dotted assembly alignment marks. Pitfalls: Too little information causes misread. Heuristic: Remove detail until misinterpretation rises, then step back. Train: Q: “What can be implied instead of drawn?” A: “Core contours only.” Q: “Where is ambiguity dangerous?” A: “Warnings and control labels.” Prompt: “Test recognition with 1-second glances.” 

Cognitive Dissonance
Def: Inconsistency between beliefs and actions creates discomfort that people try to resolve. Key: Users rationalize purchases and workflows. Industrial: Reduce post-purchase regret with honest performance, clear onboarding, and confirmation of correct setup. Examples: “You installed correctly” indicator; reassuring calibration check. Pitfalls: Dark patterns that exploit justification. Heuristic: Align promises, experience, and identity cues. Train: Q: “What will buyers tell themselves after purchase?” A: “Support it with real value.” Q: “Where might regret start?” A: “Setup friction, hidden costs.” Prompt: “List mismatches between marketing and reality.” 

Color
Def: Color communicates status, grouping, warnings, and brand meaning faster than text. Key: Color effects are contextual and culturally moderated; also constrained by accessibility. Industrial: Use color redundantly for safety states; design for color-vision differences. Examples: Red emergency stop; green “ready.” Pitfalls: Color-only coding; poor contrast under varied lighting. Heuristic: Color labels the message; shape/position carries the truth. Train: Q: “What must be color-independent?” A: “Critical alarms and controls.” Q: “What lighting conditions exist?” A: “Sunlight, low light, glare.” Prompt: “Specify contrast requirements.” 

Common Fate
Def: Elements moving or changing together are perceived as belonging together. Key: Synchronized change implies unity. Industrial: Animate or illuminate grouped controls together; in physical products, link motion paths visibly. Examples: Progress LEDs moving; linked sliders. Pitfalls: Unintentional coupling that confuses diagnosis. Heuristic: Couple feedback only when functions are coupled. Train: Q: “What should feel linked?” A: “Cause-effect pairs.” Q: “What must feel independent?” A: “Separate failure domains.” Prompt: “Show grouping via synchronized feedback.” 

Comparison
Def: People judge values relative to reference points, not in isolation. Key: Provide meaningful baselines. Industrial: Use “before/after,” reference marks, and exemplars for quality. Examples: Torque indicator with target band; battery “estimated hours.” Pitfalls: Misleading anchors. Heuristic: Always show the reference frame. Train: Q: “What’s the user comparing against?” A: “Old product, competitor, expectation.” Q: “What baseline reduces errors?” A: “Clear ranges and examples.” Prompt: “Add a ‘good vs bad’ sample.” 

Confirmation
Def: Provide explicit acknowledgement that an action was received and what it did. Key: Prevents repeated inputs and anxiety. Industrial: Use tactile clicks, indicator lights, audible beeps, and clear “locked/unlocked” states. Examples: Car key fob blink; latch “snap.” Pitfalls: Silent mode changes. Heuristic: Every critical action gets immediate, perceivable confirmation. Train: Q: “How does the user know it worked?” A: “Multisensory feedback.” Q: “What’s the reversible ‘oops’ path?” A: “Undo/unlatch.” Prompt: “List actions needing confirmation.” 

Consistency
Def: Similar things should look/act similar across a product and across a product family. Key: Consistency improves learnability and reduces cognitive load. Industrial: Standardize iconography, fastener types, torque directions, and UI patterns. Examples: Same knob turns same direction across appliances. Pitfalls: “Consistently wrong” if based on bad convention. Heuristic: Be consistent with user expectations first, internal style second. Train: Q: “What conventions exist in this category?” A: “Audit competitors/standards.” Q: “Where can we break convention safely?” A: “Where benefit is obvious.” Prompt: “Create a consistency checklist.” 

Constancy
Def: Perception tends to treat objects as stable despite changes in lighting, viewpoint, or distance. Key: Users infer “same object” under variability. Industrial: Ensure markings remain legible under glare and angle; design forms that read correctly from typical viewpoints. Examples: Matte finishes for glare control; non-ambiguous icons. Pitfalls: Important info disappears under angle/lighting. Heuristic: Design for worst-case viewing. Train: Q: “What viewing angles occur?” A: “List posture and line-of-sight.” Q: “What lighting shifts happen?” A: “Sun, tungsten, LEDs.” Prompt: “Test in real environments, not studio.” 

Constraint
Def: Limit possible actions to prevent errors and guide correct use. Key: Constraints make “wrong” physically hard. Industrial: Use keyed parts, interlocks, detents, guards, and software lockouts. Examples: Child-safe caps; connector keying. Pitfalls: Over-constraint blocks legitimate expert workflows. Heuristic: Constrain the dangerous and irreversible, not everything. Train: Q: “What must never happen?” A: “Identify catastrophic misuse.” Q: “How can geometry prevent it?” A: “Keying, rails, asymmetry.” Prompt: “Map errors to constraints.” 

Contour Bias
Def: When meaning is neutral, people often prefer curved contours over sharp angles. Key: Sharpness can signal threat; curvature can feel safe. Industrial: Use curvature in consumer touchpoints; use sharp precision cues where “technical” is desired. Examples: Rounded handles; sharp-edged “pro” tools. Pitfalls: Over-rounding reduces grip or assembly tolerance. Heuristic: Curve where touched; sharpen where indexed. Train: Q: “Should it feel safe or aggressive?” A: “Tune contour language.” Q: “Where do sharp edges injure?” A: “Break edges, add radii.” Prompt: “Identify all touch edges.” 

Control
Def: Users need a stable sense they can influence outcomes and recover from mistakes. Key: Lost control increases stress and abandonment. Industrial: Provide clear modes, overrides, manual fallback, and predictable behavior. Examples: Manual release lever; physical kill switch. Pitfalls: Hidden modes or automation surprises. Heuristic: Automation must be interruptible. Train: Q: “What can the user override?” A: “List override points.” Q: “How do they recover?” A: “Undo, reset, service.” Prompt: “Describe worst-case loss-of-control scenario.” 

Convergence
Def: Narrow options progressively as evidence increases, moving from exploration to commitment. Key: Early divergence, later convergence prevents premature lock-in. Industrial: Start with broad concept prototypes; converge on manufacturable architecture after risk tests. Examples: Foam studies then CAD; A/B mechanisms then DFM. Pitfalls: Converging before field data. Heuristic: Kill options with tests, not opinions. Train: Q: “What uncertainty blocks convergence?” A: “List unknowns.” Q: “What test resolves each?” A: “Prototype plan.” Prompt: “Define ‘ready to converge’ criteria.” 

Cost-Benefit
Def: Choose designs where expected benefits justify total costs (money, time, risk, complexity). Key: Costs include cognitive and maintenance burden. Industrial: Quantify assembly time, warranty risk, tooling, and training load. Examples: Fewer fastener types; modular service access. Pitfalls: Ignoring long-term costs. Heuristic: Optimize total lifecycle cost, not unit BOM alone. Train: Q: “What’s the hidden cost?” A: “Training, servicing, errors.” Q: “What’s user time worth?” A: “Estimate per context.” Prompt: “Make a cost-benefit table.” 

Defensible Space
Def: Environments can reduce crime/abuse by making territories observable and socially controllable. Key: Design affects behavior through visibility and ownership cues. Industrial: In public products (kiosks, shared equipment), design for surveillance lines, tamper resistance, and clear ownership boundaries. Examples: Well-lit entrances; visible help points. Pitfalls: Over-securing that harms usability. Heuristic: Make misuse visible and inconvenient. Train: Q: “Who is the ‘defender’?” A: “User, staff, community.” Q: “Where are blind spots?” A: “Map sight lines.” Prompt: “Add cues of care/ownership.” 

Depth of Processing
Def: Deeper, meaning-based processing generally produces better memory than shallow exposure. Key: Understanding beats repetition. Industrial: Teach via meaningful cause-effect explanations and hands-on steps, not long manuals. Examples: Troubleshooting “why” diagrams; interactive onboarding. Pitfalls: Overloading users with theory. Heuristic: Explain just enough “why” to make “how” stick. Train: Q: “What concept must be understood?” A: “Only those preventing errors.” Q: “How to make it meaningful?” A: “Use analogies and feedback.” Prompt: “Convert instructions into ‘goal → action → result’.” 

Design by Committee
Def: Many stakeholders without decision structure often yield diluted, inconsistent designs. Key: Consensus can average away excellence. Industrial: Use clear ownership, decision rules, and prototype-based arbitration. Examples: Single design authority; “disagree and commit.” Pitfalls: Feature accumulation and inconsistent CMF. Heuristic: One throat to choke, many brains to pick. Train: Q: “Who owns final calls?” A: “Name a decider.” Q: “What’s the arbitration artifact?” A: “User test, prototype, metric.” Prompt: “Define decision rights early.” 

Desire Line
Def: Real user behavior creates “paths” that reveal preferred interactions, often bypassing intended ones. Key: Users vote with feet and fingers. Industrial: Look for wear patterns, workarounds, repeated service calls, and “misuse” that’s actually better UX. Examples: Worn buttons; users taping over sensors. Pitfalls: Blocking desire lines instead of learning from them. Heuristic: Pave the cowpath when safe. Train: Q: “What workaround appears?” A: “Document and explain why.” Q: “Is workaround unsafe?” A: “If yes, redesign safely.” Prompt: “Inspect wear traces weekly.” 

Development Cycle
Def: Products evolve through repeating phases from concept to launch to sustainment. Key: Different decisions matter at different phases. Industrial: Match fidelity and validation to stage; don’t over-tool early. Examples: EVT/DVT/PVT style gates; pilot runs. Pitfalls: Skipping validation to “save time.” Heuristic: Increase commitment only after risk retirement. Train: Q: “What stage are we in?” A: “Discovery, prototype, validation, production.” Q: “What’s the next gate?” A: “Define criteria.” Prompt: “List stage-appropriate deliverables.” 

Entry Point
Def: The place users start strongly determines how they interpret the whole experience. Key: First impressions bias navigation. Industrial: Design packaging open, first-touch, and first-screen to lead correctly. Examples: “Start here” tab; prominent power button. Pitfalls: Multiple competing entry points. Heuristic: One dominant, obvious start. Train: Q: “Where do users begin naturally?” A: “Observe first-touch.” Q: “Is the start safe?” A: “Prevent dangerous starts.” Prompt: “Design the unboxing path.” 

Errors
Def: Mistakes are often design-induced mismatches between system and human limits. Key: Reduce error likelihood and error cost. Industrial: Use poka-yoke, guardrails, and forgiving defaults; provide clear error recovery. Examples: Reversible assembly; keyed connectors. Pitfalls: Blaming “user error” without redesign. Heuristic: Prevent critical errors; forgive minor ones. Train: Q: “Top error in field?” A: “Rank by harm and frequency.” Q: “Can we make it impossible?” A: “Add constraint.” Prompt: “Write recovery steps in plain language.” 

Expectation Effect
Def: Expectations shape perception of performance and satisfaction. Key: What users think will happen changes what they experience. Industrial: Calibrate marketing claims, sound/design cues, and performance feedback to match reality. Examples: “Premium click” implies precision. Pitfalls: Overhyping; disappointment dominates memory. Heuristic: Underpromise, overdeliver, then prove it. Train: Q: “What expectation does the form create?” A: “List implied attributes.” Q: “Where might mismatch occur?” A: “Battery life, durability, speed.” Prompt: “Align cues with measured performance.” 

Exposure Effect
Def: Familiarity through repeated exposure often increases liking, up to a point. Key: Familiar forms reduce adoption friction. Industrial: Use recognizable metaphors and gradual innovation (MAYA-friendly). Examples: Thermostat dial returning as smart ring. Pitfalls: Novelty that breaks learnability or trust. Heuristic: Keep one foot in the familiar. Train: Q: “What must feel familiar?” A: “Core interaction pattern.” Q: “What can be novel?” A: “Secondary delight features.” Prompt: “List familiar anchors.” 

Face-ism Ratio
Def: How much face vs body is shown affects perceived intellect/agency in images. Key: Framing influences social judgment. Industrial: In manuals/ads, show faces when competence/agency matters; avoid objectifying framing. Examples: Pro tool poster with head-focused framing. Pitfalls: Unintended gender bias. Heuristic: Frame people to match role and respect. Train: Q: “What does this framing imply?” A: “Agency vs object.” Q: “Is bias introduced?” A: “Audit across genders.” Prompt: “Standardize depiction guidelines.” 

Factor of Safety
Def: Design strength/capacity should exceed expected loads by a deliberate margin. Key: Real loads vary; uncertainty exists. Industrial: Choose safety factors for materials, joints, and worst-case misuse; include fatigue and aging. Examples: Ladders rated above typical load; over-spec hinges. Pitfalls: Overdesign causing cost/weight; underdesign causing recalls. Heuristic: Safety factor is not optional; tune it to harm severity. Train: Q: “What’s worst credible load?” A: “Include misuse and environment.” Q: “What fails first?” A: “Identify weakest link.” Prompt: “Document safety-factor rationale.” 

Feedback Loop
Def: Outputs influence future inputs, stabilizing or amplifying behavior. Key: Feedback is how systems self-correct. Industrial: Provide immediate, interpretable feedback for adjustments and calibration. Examples: Thermostat shows target vs current; torque wrench clicks. Pitfalls: Delayed/ambiguous feedback causes oscillation and frustration. Heuristic: Shorten feedback delay; clarify direction. Train: Q: “What feedback does each action produce?” A: “Map action → signal.” Q: “Is feedback reversible?” A: “Allow fine tuning.” Prompt: “Reduce latency and ambiguity.” 

Fibonacci Sequence
Def: A number sequence whose ratios approach the golden ratio; used as a proportional generator. Key: Useful as a structured proportion tool, not magic. Industrial: Use as a design grid option for layout explorations, then validate by usability and manufacturing. Examples: Panel subdivision; packaging layout. Pitfalls: Mythologizing proportions as inherently “best.” Heuristic: Use as a starting scaffold, then measure outcomes. Train: Q: “Why this proportion here?” A: “State functional goal.” Q: “Is it measurable better?” A: “Test readability/reach.” Prompt: “Try 2 alternative grids.” 

Figure-Ground Relationship
Def: People separate a focal “figure” from background to understand a scene. Key: Contrast and edges define what stands out. Industrial: Make critical controls and readouts pop; suppress noncritical background texture. Examples: Emergency stop button; high-contrast display. Pitfalls: Busy CMF that competes with controls. Heuristic: The figure should win in 200 ms. Train: Q: “What must be figure?” A: “Safety + primary controls.” Q: “What should recede?” A: “Decorative detail.” Prompt: “Test with squint/glare.” 

Fitts’ Law
Def: Pointing time rises with distance and falls with target size. Key: Make targets big and near. Industrial: Size/space critical buttons; reduce reach distance; consider gloves and vibration. Examples: Large emergency stop; big touch targets. Pitfalls: Tiny “secondary” targets that are actually common. Heuristic: Make frequent targets larger, closer, and separated. Train: Q: “Which target is used most under stress?” A: “Enlarge and isolate it.” Q: “What’s D and W in real use?” A: “Measure reach and aperture.” Prompt: “Simulate with gloves.” 

Five Hat Racks
Def: Most information can be organized by a small set of schemes (location, alphabet, time, category, continuum/hierarchy). Key: Organization choices change what users notice. Industrial: Apply to control grouping, menus, parts catalogs, IFUs, service docs. Examples: Parts list by subsystem; troubleshooting by symptom. Pitfalls: Mixing schemes without clear cues. Heuristic: Choose one primary organizing scheme per view. Train: Q: “What is the user’s lookup strategy?” A: “Time, location, category, etc.” Q: “Is the scheme consistent?” A: “Don’t switch mid-flow.” Prompt: “Label the scheme explicitly.” 

Flexibility-Usability Tradeoff
Def: More options and flexibility usually raise complexity and learning cost. Key: Power-user features can punish novices. Industrial: Use modes, presets, progressive disclosure, and modular accessories. Examples: Basic vs advanced settings; tool attachments. Pitfalls: Shipping “everything” in one interface. Heuristic: Default simple; reveal power when needed. Train: Q: “Who is novice vs expert?” A: “Define personas.” Q: “What must be always visible?” A: “Top tasks only.” Prompt: “Design an ‘expert path’ separately.” 

Forgiveness
Def: Designs should reduce the penalty of errors and support recovery. Key: Humans will slip; make slips cheap. Industrial: Reversible steps, generous tolerances, undo/reset, and clear guidance for recovery. Examples: Symmetric parts that fit either way; reset hole. Pitfalls: Forgiveness that enables dangerous misuse. Heuristic: Forgive reversible actions; block irreversible harm. Train: Q: “What’s the worst slip?” A: “Design it out.” Q: “What’s the reset path?” A: “Make it discoverable.” Prompt: “Add an error-recovery storyboard.” 

Form Follows Function
Def: Form should arise from purpose and constraints, not decoration alone. Key: Function includes human meaning, not just mechanics. Industrial: Let ergonomics, assembly, and user goals shape geometry; keep ornament truthful. Examples: Tool handle shaped by grip; vent pattern tied to airflow. Pitfalls: Using the phrase to justify blandness. Heuristic: Make function visible and form intentional. Train: Q: “What function drives this surface?” A: “Grip, airflow, structure, signal.” Q: “Is any feature ornamental-only?” A: “If yes, justify it.” Prompt: “Trace each form cue to a function.” 

Framing
Def: The way choices are presented changes decisions, even with identical outcomes. Key: Frames set reference points and perceived losses/gains. Industrial: Frame setup choices as recommended defaults; present safety choices as preventing loss. Examples: “Recommended” vs “custom”; warranty framing. Pitfalls: Manipulative framing that harms trust. Heuristic: Use framing to clarify, not to trick. Train: Q: “What is the user afraid of losing?” A: “Time, money, safety.” Q: “What reference point do they use?” A: “Default state.” Prompt: “Rewrite choices in neutral language.” 

Freeze-Flight-Fight-Forfeit
Def: Under threat/stress, people may freeze, escape, confront, or give up. Key: Stress crushes cognition; design for panic. Industrial: Emergency egress, obvious stop controls, minimal steps under alarm. Examples: Big red e-stop; one-motion release. Pitfalls: Multi-step safety-critical actions. Heuristic: In emergencies, one action, one result. Train: Q: “What happens under panic?” A: “Users miss cues and fumble.” Q: “Can this be one-step?” A: “Simplify.” Prompt: “Run a stress scenario walkthrough.” 

Garbage In–Garbage Out
Def: Output quality cannot exceed input quality. Key: Bad data or assumptions yield bad results. Industrial: Calibrate sensors; constrain user inputs; validate manufacturing measurements. Examples: Misaligned jig causes scrap; wrong firmware parameters. Pitfalls: Blaming downstream teams. Heuristic: Validate inputs at the source. Train: Q: “What inputs drive this output?” A: “List all.” Q: “Which input is least reliable?” A: “Add checks.” Prompt: “Design input validation.” 

Golden Ratio
Def: A mathematical proportion used historically as a compositional tool; aesthetic “magic” claims are often overstated. Key: Use as a scaffold, not a guarantee of beauty. Industrial: Explore golden rectangles in layout, then verify ergonomics and usability. Examples: Display partitioning; brand mark grids. Pitfalls: Pseudoscience justification. Heuristic: Never cite the ratio as proof; test instead. Train: Q: “What problem does this proportion solve?” A: “Hierarchy/fit.” Q: “Any evidence it helps here?” A: “Run preference/usability tests.” Prompt: “Try 1:1.618 and 1:1.5 and compare.” 

Good Continuation
Def: People tend to perceive smooth, continuous lines/paths as belonging together. Key: Continuity guides attention. Industrial: Use continuous grooves, rails, or graphic lines to show flows and sequences. Examples: Arrowed cable routing; continuous seam line. Pitfalls: Unintended lines that imply wrong action. Heuristic: Draw the eye along the correct path. Train: Q: “What path should attention follow?” A: “Make it continuous.” Q: “Any false paths?” A: “Break or de-emphasize them.” Prompt: “Add continuity cues to the workflow.” 

Gutenberg Diagram
Def: In left-to-right reading cultures, eyes often scan in predictable zones, affecting where attention lands. Key: Place key elements where scanning expects them. Industrial: In IFUs and screens, place critical actions early and in dominant scan zones. Examples: Quick-start “Step 1” top-left; confirm bottom-right. Pitfalls: Assuming one scan pattern for all cultures/tasks. Heuristic: Put the primary action in the primary scan path. Train: Q: “What’s the first thing seen?” A: “Make it the right thing.” Q: “Is reading direction different?” A: “Localize layout.” Prompt: “Heatmap test with novices.” 

Hick’s Law
Def: Decision time increases as the number and uncertainty of choices increases, often logarithmically. Key: Too many options slows and frustrates. Industrial: Reduce visible choices, group them, or use progressive disclosure and defaults. Examples: Mode dial with few positions; simplified settings menu. Pitfalls: Hiding critical choice behind deep menus. Heuristic: Fewer, clearer choices at the moment of action. Train: Q: “How many choices are presented at once?” A: “Minimize.” Q: “Can you set a sensible default?” A: “Yes, then allow change.” Prompt: “Group choices into 3–5 categories.” 

Hierarchy
Def: Arrange elements so importance and relationships are obvious. Key: Hierarchy reduces search and errors. Industrial: Prioritize safety, primary task controls, then secondary settings. Examples: Big primary knob; secondary buttons smaller. Pitfalls: Visual hierarchy contradicting functional priority. Heuristic: Size, position, contrast follow importance. Train: Q: “What are the top 3 actions?” A: “Make them dominant.” Q: “What must never be dominant?” A: “Destructive actions.” Prompt: “Rank elements by task frequency.” 

Hierarchy of Needs
Def: Users prioritize foundational needs (safety, reliability) before higher-level delight. Key: Delight cannot compensate for fear or failure. Industrial: Ensure safety, comfort, and reliability before adding “premium” features. Examples: Stable chair before fancy fabric; safe latch before styling. Pitfalls: Chasing delight while basics fail. Heuristic: Nail basics, then add sparkle. Train: Q: “What is the safety baseline?” A: “Define non-negotiables.” Q: “What is ‘delight’ here?” A: “After basics pass.” Prompt: “List needs from base to peak.” 

Highlighting
Def: Emphasize critical information so it stands out from noise. Key: Attention is scarce. Industrial: Highlight emergency instructions, current state, and next action with contrast, placement, and redundancy. Examples: Yellow caution label; active mode indicator. Pitfalls: Highlighting everything (then nothing). Heuristic: One primary highlight per view/state. Train: Q: “What must be noticed now?” A: “Only the next safe action.” Q: “What can be muted?” A: “Everything else.” Prompt: “Remove one highlight and see if clarity improves.” 

Horror Vacui
Def: Fear of empty space can lead to overfilling designs, reducing clarity. Key: White space is functional. Industrial: Leave breathing room around controls and instructions; avoid cluttered dashboards. Examples: Simple stove control labeling; sparse packaging front. Pitfalls: Cramming features and labels. Heuristic: Empty space is where comprehension lives. Train: Q: “Is space doing work?” A: “Yes, it separates groups.” Q: “What can be removed?” A: “Low-value labels/features.” Prompt: “Try a 20% de-clutter pass.” 

Hunter-Nurturer Fixations
Def: Some products appeal to common “pursuit/tool” vs “care/comfort” motivations; average preferences can differ by user segments. Key: Segment carefully; avoid stereotyping as destiny. Industrial: Validate segment motivations with research; don’t hard-code gender assumptions. Examples: Rugged tool aesthetics vs cozy home appliance cues. Pitfalls: Reinforcing bias; alienating users. Heuristic: Design to jobs-to-be-done, not gender clichés. Train: Q: “What motivation is targeted?” A: “Competence/power vs care/comfort.” Q: “What evidence supports this?” A: “Segment research, not vibes.” Prompt: “Write segment hypotheses, then test.” 

Iconic Representation
Def: Use pictorial representations that resemble what they mean to speed recognition. Key: Icons reduce dependence on language when well-chosen. Industrial: Use tested pictograms for safety and controls; ensure cultural fit. Examples: Power symbol; hazard pictograms. Pitfalls: Ambiguous icons without labels. Heuristic: If an icon needs guessing, add text or redesign. Train: Q: “Can a novice name the icon?” A: “Test quickly.” Q: “Is it standard?” A: “Prefer standards.” Prompt: “Run 5-second comprehension tests.” 

Immersion
Def: Sustained engagement arises when sensory input and cognitive challenge match user capacity. Key: Too hard bores/frustrates; too easy disengages. Industrial: In exhibits, training simulators, or complex tools, tune feedback richness and challenge pacing. Examples: VR training; interactive museum stations. Pitfalls: Sensory overload without goal clarity. Heuristic: Keep goals clear, feedback rich, challenge adjustable. Train: Q: “What is the user’s goal loop?” A: “Goal → action → feedback → progress.” Q: “Where does overload occur?” A: “Reduce noise or complexity.” Prompt: “Define flow-state difficulty bands.” 

Inattentional Blindness
Def: When focused, people often miss unexpected but visible stimuli. Key: “Visible” is not “noticed.” Industrial: Don’t rely on passive warnings; use interruptive cues for hazards. Examples: Alarm that pauses machine; forced acknowledgment. Pitfalls: Tiny warnings in busy panels. Heuristic: Critical alerts must break the current attentional set. Train: Q: “What will users be focused on?” A: “Primary task.” Q: “How will alerts cut through?” A: “Distinct modality + placement.” Prompt: “Test under realistic multitasking.” 

Interference Effects
Def: Similar memories or tasks can compete, reducing recall and increasing errors. Key: Similarity causes confusion. Industrial: Differentiate similar controls, connectors, and modes; avoid “almost the same” labels. Examples: Unique connector shapes; distinct alarm patterns. Pitfalls: Reusing same icons for different functions. Heuristic: Similar function can be similar; similar form must not mean different function. Train: Q: “What gets confused with what?” A: “List near-neighbors.” Q: “How to disambiguate?” A: “Shape, color, spacing, labels.” Prompt: “Create a confusion matrix.” 

Inverted Pyramid
Def: Present the most important information first, then details. Key: People skim; prioritize. Industrial: In manuals, labels, and onboarding, put safety and first actions upfront. Examples: “Stop using if…” first; quick start before specs. Pitfalls: Burying critical warnings. Heuristic: Lead with what prevents failure. Train: Q: “What’s most critical?” A: “Safety + first success step.” Q: “What can be appendix?” A: “Rarely used details.” Prompt: “Rewrite content in 3 tiers.” 

Iteration
Def: Repeated cycles of making and testing improve designs faster than debate. Key: Learning accumulates through prototypes. Industrial: Prototype early, test often, and capture learnings; iterate mechanism, ergonomics, and serviceability. Examples: Foam grips; rapid 3D prints. Pitfalls: Iterating without measurement. Heuristic: Each iteration must answer a question. Train: Q: “What question does this prototype test?” A: “State it.” Q: “What changed since last?” A: “One variable.” Prompt: “Log iteration hypotheses/results.” 

Law of Prägnanz
Def: People tend to perceive the simplest, most stable form from complex stimuli. Key: Simplicity wins in perception. Industrial: Simplify icons, silhouettes, and control groupings so the “good form” is obvious. Examples: Clear pictograms; clean product silhouette. Pitfalls: Oversimplifying away needed cues. Heuristic: Make the simplest interpretation the correct one. Train: Q: “What’s the simplest reading?” A: “Ensure it’s true.” Q: “What adds needless complexity?” A: “Remove.” Prompt: “Test silhouette recognition.” 

Layering
Def: Organize information and functions in layers to manage complexity. Key: Reveal depth when needed. Industrial: Separate basic vs advanced functions; physical layers (covers) for service-only components. Examples: Battery door; advanced settings menu. Pitfalls: Hiding frequent actions too deep. Heuristic: Put frequent actions on surface, rare ones in layers. Train: Q: “What belongs on the top layer?” A: “Top tasks + safety.” Q: “How to access deeper layers?” A: “Clear, reversible path.” Prompt: “Map layers to user expertise.” 

Legibility
Def: Individual characters/symbols must be distinguishable under real conditions. Key: Legibility is physical plus contextual (lighting, angle). Industrial: Choose fonts, stroke widths, emboss depth, and contrast for glare and wear. Examples: High-contrast etched markings; backlit icons. Pitfalls: Fashion fonts on safety labels. Heuristic: If it can’t be read at arm’s length in glare, it’s decoration. Train: Q: “What’s the worst viewing case?” A: “Glare, distance, motion.” Q: “What’s the minimum size?” A: “Test, then specify.” Prompt: “Prototype markings in real materials.” 

Life Cycle
Def: Products have stages from creation through use, maintenance, and end-of-life. Key: Design decisions shift impacts across stages. Industrial: Design for repair, disassembly, recyclability, and long-term service. Examples: Modular batteries; standardized fasteners. Pitfalls: Optimizing for sale but not ownership. Heuristic: Design for the whole ownership curve. Train: Q: “What fails first in the field?” A: “Design for replacement.” Q: “How is it disposed?” A: “Plan disassembly.” Prompt: “Create a lifecycle map.” 

Mapping
Def: The relationship between controls and effects should be obvious and natural. Key: Good mapping reduces errors and training. Industrial: Align knob positions with burners, joystick motion with movement, and app UI with physical layout. Examples: Stove control layout matching burners. Pitfalls: Arbitrary mappings that require memorization. Heuristic: Put control where the effect is. Train: Q: “How would a novice map this?” A: “By spatial analogy.” Q: “Can mapping be made physical?” A: “Shape/position.” Prompt: “Test ‘no-label’ mapping.” 

Mental Model
Def: Users carry internal explanations of how a system works; mismatches cause errors. Key: Design should match or teach the right model. Industrial: Use transparent mechanisms, diagrams, and consistent behavior to shape correct expectations. Examples: Visible water tank level; status indicators. Pitfalls: Hidden automation causing wrong assumptions. Heuristic: Either match the model or explicitly teach a new one. Train: Q: “What does the user think happens?” A: “Elicit via interview.” Q: “Where is the model wrong?” A: “Fix cues or behavior.” Prompt: “Draw the system as users describe it.” 

Mimicry
Def: People respond positively to cues that mirror familiar behaviors or forms. Key: Mimicry builds comfort and rapport. Industrial: Use familiar gestures and forms when introducing new tech (MAYA). Examples: Digital page “turn”; knob-like UI. Pitfalls: Fake mimicry that blocks better interaction. Heuristic: Mimic the benefit, not the artifact. Train: Q: “What familiar behavior is being mimicked?” A: “Name it.” Q: “Does it help the task?” A: “If no, drop it.” Prompt: “List the ‘familiar anchors’.” 

Mnemonic Device
Def: Use memory aids (patterns, rhymes, spatial encoding) to improve recall. Key: Good mnemonics reduce training burden. Industrial: Use consistent icon sets, color codes with redundancy, and simple checklists. Examples: LATCH acronym; setup checklist sticker. Pitfalls: Too many mnemonics become noise. Heuristic: One mnemonic per recurring workflow. Train: Q: “What must be remembered?” A: “Only recurring steps.” Q: “What’s the simplest cue?” A: “Acronym, pattern, color+shape.” Prompt: “Turn steps into a checklist.” 

Modularity
Def: Build systems from semi-independent modules with clear interfaces. Key: Increases maintainability and upgrade paths, but adds design complexity. Industrial: Enable field replacement, customization, and service by modular architecture. Examples: Replaceable battery module; snap-in accessories. Pitfalls: Interface complexity and tolerance stack issues. Heuristic: Modularize where change/repair is likely. Train: Q: “Which parts must be serviceable?” A: “Make them modules.” Q: “What’s the interface standard?” A: “Define mechanically/electrically.” Prompt: “Design for module swap in 5 minutes.” 

Most Advanced Yet Acceptable
Def: Successful innovation often balances novelty with familiar cues users can adopt. Key: Too new scares; too familiar bores. Industrial: Keep core interaction familiar while innovating in performance/materials. Examples: Streamlined yet recognizable vehicles. Pitfalls: Shipping “future shock” without scaffolding. Heuristic: Add one bold innovation per release, support it with familiar anchors. Train: Q: “What’s the familiar anchor?” A: “Keep it stable.” Q: “What’s the novel benefit?” A: “Make it obvious.” Prompt: “Rate novelty 1–5 and justify.” 

Most Average Facial Appearance Effect
Def: Averaged composite faces are often judged more attractive than many individual faces. Key: Prototypicality can read as “safe/normal.” Industrial: In avatars and character design, “average” can increase broad appeal. Examples: Default assistant face; generic icon people. Pitfalls: Blandness; lack of brand uniqueness. Heuristic: Start from average, then add distinctive brand cues. Train: Q: “Do we want broad appeal or niche identity?” A: “Choose.” Q: “What distinctive cues remain?” A: “Add controlled uniqueness.” Prompt: “Test with diverse users.” 

Normal Distribution
Def: Many natural variations cluster around a mean with fewer extremes. Key: Designing only for “average” excludes many users. Industrial: Use percentiles and inclusive ranges for ergonomics and fit. Examples: Adjustable chair; multiple grip sizes. Pitfalls: “One-size-fits-all” hand tools. Heuristic: Design to a defined percentile range, then validate edge cases. Train: Q: “Which body dimension matters?” A: “Reach, grip, vision.” Q: “What percentile range?” A: “Set target (e.g., 5th–95th).” Prompt: “List excluded users explicitly.” 

Not Invented Here
Def: Teams may resist external ideas/solutions due to ownership bias. Key: Pride can block better outcomes. Industrial: Evaluate suppliers and standards fairly; reuse proven modules. Examples: Standard fasteners; off-the-shelf sensors. Pitfalls: Reinventing wheels with worse reliability. Heuristic: Adopt proven standards unless you can prove advantage. Train: Q: “Why build vs buy?” A: “Document measurable benefit.” Q: “What standard exists?” A: “Survey before designing.” Prompt: “Run a ‘humility sprint’ on existing solutions.” 

Nudge
Def: Design choice environments so better decisions are easier without removing options. Key: Defaults and ordering matter. Industrial: Use safe defaults, clear recommendations, and friction for dangerous actions. Examples: Default eco-mode; confirmation for factory reset. Pitfalls: Manipulation that harms autonomy/trust. Heuristic: Nudge toward safety and user benefit, transparently. Train: Q: “What default is safest?” A: “Set it.” Q: “Where do users need friction?” A: “Destructive actions.” Prompt: “List choices and their default.” 

Ockham’s Razor
Def: Prefer simpler explanations and designs when they achieve the goals. Key: Complexity has ongoing costs. Industrial: Reduce part count, modes, and dependencies. Examples: One latch instead of two; integrated gasket. Pitfalls: Oversimplifying and losing necessary function. Heuristic: Simplify until requirements break, then add only what’s needed. Train: Q: “What can be removed?” A: “Any non-essential part or mode.” Q: “What does complexity buy us?” A: “Name benefit.” Prompt: “Do a part-count reduction pass.” 

Operant Conditioning
Def: Behavior changes based on reinforcement or punishment following actions. Key: Reward schedules shape habits. Industrial: Reinforce safe and efficient behavior (clear success feedback); avoid “addictive” variable rewards unless ethical. Examples: “Task complete” haptic; maintenance streaks. Pitfalls: Rewarding the wrong behavior. Heuristic: Reinforce the behavior you truly want repeated. Train: Q: “What behavior is rewarded?” A: “Define explicitly.” Q: “What’s the reinforcement schedule?” A: “Predictable early.” Prompt: “Audit unintended rewards.” 

Orientation Sensitivity
Def: Perception discriminates orientations unevenly; cardinal directions often process differently than oblique. Key: Orientation affects detectability and comfort. Industrial: Use strong horizontal/vertical alignment for critical grids; avoid subtle oblique cues for safety-critical info. Examples: Vertical sliders for up/down. Pitfalls: Decorative angles disrupting legibility. Heuristic: Keep critical orientation cues simple and consistent. Train: Q: “Is any cue too subtle/angled?” A: “Make it cardinal.” Q: “Does orientation signal direction?” A: “Ensure mapping.” Prompt: “Test quick orientation recognition.” 

Performance Load
Def: Cognitive load rises with task complexity and splits attention. Key: Load reduces learning and increases errors. Industrial: Reduce steps, simplify displays, and offload memory to the environment. Examples: Checklists; pre-set programs. Pitfalls: Overloading under stress conditions. Heuristic: Design for the busiest moment. Train: Q: “When is load highest?” A: “Identify peak complexity.” Q: “What can be automated safely?” A: “Offload without hiding state.” Prompt: “Remove one decision from the peak moment.” 

Performance Versus Preference
Def: What users say they like can diverge from what makes them faster/safer. Key: Preference is not performance. Industrial: Measure task time, error rate, fatigue, and safety, not just “looks good.” Examples: Users prefer heavier tool feel yet fatigue rises. Pitfalls: Designing for “cool” over effective. Heuristic: Optimize for outcomes; then tune preference cues. Train: Q: “What is the performance metric?” A: “Time, errors, strain.” Q: “What is the preference metric?” A: “Rated comfort/appeal.” Prompt: “Run A/B with objective measures.” 

Personas
Def: Fictional-but-evidence-based user archetypes representing key segments and goals. Key: Personas prevent “designing for everyone,” which designs for no one. Industrial: Include context-of-use, physical constraints, and safety responsibilities. Examples: “Maintenance tech in gloves”; “elderly home user.” Pitfalls: Persona fanfiction without research. Heuristic: Personas must be tied to real data. Train: Q: “Who is the primary persona?” A: “Name role + goal.” Q: “What constraint dominates?” A: “Dexterity, time, risk.” Prompt: “Write a day-in-the-life paragraph.” 

Picture Superiority Effect
Def: Images are often remembered better than words alone. Key: Visual instruction improves recall, especially under stress. Industrial: Use diagrams, photos, and icon sequences for setup and safety. Examples: Airline safety cards; assembly diagrams. Pitfalls: Ambiguous drawings without context. Heuristic: Show the action, not just describe it. Train: Q: “Which step should be visual?” A: “Any high-error step.” Q: “Does the picture show direction and grip?” A: “Add arrows and hand cues.” Prompt: “Replace one paragraph with a diagram.” 

Priming
Def: Prior cues influence perception and decisions without conscious intent. Key: Surroundings and wording steer attention. Industrial: Prime safe behavior with cues and ordering; avoid misleading primes. Examples: Safety-first checklist at startup. Pitfalls: Priming the wrong interpretation (e.g., “toy-like” cues on serious tools). Heuristic: Prime the intended mode before the action. Train: Q: “What mindset should start-up evoke?” A: “Careful, playful, professional.” Q: “What cues prime it?” A: “Tone, materials, prompts.” Prompt: “Verify primes across cultures.” 

Progressive Disclosure
Def: Reveal complexity only as it becomes relevant, keeping initial interaction simple. Key: Prevents overwhelm while preserving power. Industrial: Stage advanced settings, calibration, and service menus; show essentials first. Examples: “Show details” print dialogs; “advanced” maintenance mode. Pitfalls: Hiding necessary info for safety. Heuristic: Delay complexity, never hide critical state. Train: Q: “What is essential now?” A: “Only next step.” Q: “What is advanced?” A: “Rare settings.” Prompt: “Design novice and expert flows.” 

Propositional Density
Def: The amount of meaning conveyed per unit (word, symbol, feature) affects comprehension and memorability. Key: Dense meaning can be powerful or overwhelming. Industrial: Use dense symbols sparingly; simplify safety-critical messaging; avoid feature-overloaded interfaces. Examples: Icon-heavy dashboards; minimalist products with strong semantics. Pitfalls: Overloading users with too many “messages.” Heuristic: Increase meaning density only where users have time to parse. Train: Q: “How many meanings per element?” A: “Prefer one primary meaning.” Q: “Where can density be reduced?” A: “Critical workflows.” Prompt: “Count meanings per control.” 

Prospect-Refuge
Def: People often prefer spaces offering both outward view (prospect) and a sense of protected enclosure (refuge). Key: Safety and control shape preference. Industrial: In interiors (vehicles, cabins, kiosks), provide visibility plus protected seating/controls. Examples: Window seat nook; driver cockpit. Pitfalls: Over-enclosure causing claustrophobia. Heuristic: Give users a view and a back. Train: Q: “Where is prospect needed?” A: “Work/monitoring areas.” Q: “Where is refuge needed?” A: “Rest/private activities.” Prompt: “Map prospect and refuge zones.” 

Prototyping
Def: Build representations to learn and de-risk decisions before full commitment. Key: Prototypes are questions made tangible. Industrial: Prototype ergonomics, mechanisms, and maintenance access early; use appropriate fidelity. Examples: Cardboard mockups; 3D printed latches. Pitfalls: Confusing prototype polish with readiness. Heuristic: Prototype the risk, not the whole product. Train: Q: “What’s the biggest risk?” A: “Prototype that first.” Q: “What fidelity is needed?” A: “Lowest that answers question.” Prompt: “Plan prototype → test → decision.” 

Proximity
Def: Elements near each other are perceived as related. Key: Spacing communicates grouping. Industrial: Group related controls; separate dangerous from routine. Examples: Media buttons clustered; e-stop isolated. Pitfalls: Grouping convenience with destructive actions. Heuristic: Distance is a meaning signal. Train: Q: “What should be grouped?” A: “Same task.” Q: “What should be separated?” A: “High-risk actions.” Prompt: “Redraw spacing to show hierarchy.” 

Readability
Def: Text should be easy to read and understand, not just visible. Key: Plain language reduces errors. Industrial: Use short sentences, active voice, and step-by-step instructions; localize carefully. Examples: Clear safety labels; simple troubleshooting. Pitfalls: Legalese and long paragraphs. Heuristic: Write for stressed novices. Train: Q: “Can a novice paraphrase it?” A: “If not, rewrite.” Q: “Is it scannable?” A: “Use headings and bullets sparingly.” Prompt: “Reduce sentence length.” 

Recognition Over Recall
Def: Make needed options visible so users don’t have to remember them. Key: Recognition is easier than recall. Industrial: Use labeled controls, in-context help, and visible state indicators. Examples: Labeled ports; on-device quick guide. Pitfalls: Hidden gestures; unlabeled modes. Heuristic: If it’s needed, show it when needed. Train: Q: “What are users forced to remember?” A: “List and externalize.” Q: “Can we label it?” A: “Yes, ideally.” Prompt: “Replace memory steps with cues.” 

Red Effect
Def: Red can bias judgments and behavior (attention, dominance, attraction), context-dependent and not always replicable. Key: Color meanings vary; effects can be fragile. Industrial: Use red primarily for hazards and stop states; be cautious using it as “appeal” signal. Examples: Emergency stop red; warning labels. Pitfalls: Red used decoratively near hazards causing ambiguity. Heuristic: Reserve red for “stop/danger” unless strong reason. Train: Q: “What does red mean here?” A: “Define per standards/culture.” Q: “Could it distract?” A: “Yes, reduce scope.” Prompt: “Audit red usage across states.” 

Redundancy
Def: Provide multiple independent cues for critical information. Key: One channel can fail (noise, blindness, wear). Industrial: Pair color with shape and text; pair alarms with haptics. Examples: Brake lights + indicator sound; triangle hazard icon + “WARNING.” Pitfalls: Too much redundancy becomes clutter. Heuristic: Redundancy for safety-critical, minimal for routine. Train: Q: “What failures remove a cue?” A: “Glare, dirt, deafness.” Q: “What second cue covers it?” A: “Shape/text/haptic.” Prompt: “List critical cues and backups.” 

Rosetta Stone
Def: Use a known reference system to decode an unfamiliar one. Key: Bridge new concepts to known patterns. Industrial: Use familiar metaphors, calibration references, and “translation” labels. Examples: “USB-like” port symbol; “home” position marker. Pitfalls: Wrong analogy misleads mental model. Heuristic: Choose analogies that match behavior, not appearance only. Train: Q: “What known system can teach this?” A: “Pick closest reliable analogy.” Q: “Where does the analogy break?” A: “Warn or redesign.” Prompt: “Add a comparison graphic.” 

Rule of Thirds
Def: A compositional heuristic dividing a field into thirds to place focal elements off-center. Key: Useful as a starter grid, not a law. Industrial: Use in packaging, UI layout, and product photography; validate with hierarchy and readability. Examples: Product hero shot composition; dashboard layout. Pitfalls: Cargo-cult composition. Heuristic: Use thirds to explore, then choose what communicates best. Train: Q: “What is the focal element?” A: “Place it intentionally.” Q: “Does the grid aid hierarchy?” A: “If no, ignore it.” Prompt: “Try centered vs thirds and compare.” 

Satisficing
Def: People often choose the first option that is “good enough” rather than optimal. Key: Decision-makers have limited time and cognition. Industrial: Provide strong defaults, recommended choices, and quick paths to success. Examples: “Auto” mode; preset programs. Pitfalls: Too many near-equal options. Heuristic: Make the best choice the easiest choice. Train: Q: “What’s ‘good enough’ for most users?” A: “Define threshold.” Q: “What default meets it?” A: “Set it.” Prompt: “Reduce choice overload.” 

Savanna Preference
Def: People often prefer environments with cues of openness, resources, and safety, possibly reflecting evolved preferences. Key: Preference patterns exist but vary by culture and context. Industrial: In spaces/products, provide openness, visibility, and resource cues (light, water, greenery) when appropriate. Examples: Park-like lobbies; open retail layouts. Pitfalls: Overgeneralizing. Heuristic: Use as a hypothesis, then test with target users. Train: Q: “Does openness increase comfort here?” A: “Test.” Q: “What safety cues matter?” A: “Visibility + refuges.” Prompt: “Collect preference data.” 

Scaling Fallacy
Def: A design that works at one scale can fail when scaled up or down. Key: Physics and perception change with scale. Industrial: Re-evaluate grip forces, structural stiffness, UI target sizes, and thermal behavior after scaling. Examples: Miniaturized buttons become unusable. Pitfalls: Scaling geometry without scaling tolerances/materials. Heuristic: Re-derive constraints at each scale. Train: Q: “What changes with scale?” A: “Forces, heat, stiffness, reach.” Q: “What must be re-tested?” A: “Everything user touches.” Prompt: “Create a scaling checklist.” 

Scarcity
Def: Perceived limited availability can increase desire and urgency. Key: Scarcity is powerful and ethically risky. Industrial: Use scarcity messaging only when true (limited supply, limited seats); avoid coercive countdowns. Examples: Limited edition runs; capacity-limited services. Pitfalls: Trust damage from fake scarcity. Heuristic: Scarcity claims must be factual and verifiable. Train: Q: “Is scarcity real?” A: “Prove it.” Q: “Does urgency help or harm?” A: “Avoid for safety-critical decisions.” Prompt: “Audit persuasive tactics for ethics.” 

Self-Similarity
Def: Repeating patterns at different scales can create coherence and learnable structure. Key: Pattern repetition aids comprehension and identity. Industrial: Use consistent motifs across product, packaging, and UI; use repeated geometry patterns for grip or airflow. Examples: Repeating vent pattern; brand motif. Pitfalls: Pattern noise and moiré. Heuristic: Repeat with restraint; vary only to signal function changes. Train: Q: “What pattern repeats across touchpoints?” A: “Define brand geometry.” Q: “Does repetition aid navigation?” A: “Use for hierarchy.” Prompt: “Create a pattern library.” 

Serial Position Effects
Def: Items at the beginning and end of a sequence are often remembered better than the middle. Key: Order matters. Industrial: Put critical steps first and last; avoid burying warnings mid-list. Examples: Safety step at start and confirmation at end. Pitfalls: Overstuffing the middle. Heuristic: Reserve the middle for low-critical detail. Train: Q: “What must be remembered?” A: “Place at primacy/recency positions.” Q: “What’s forgotten?” A: “Middle items.” Prompt: “Shorten the sequence.” 

Shaping
Def: Teach complex behavior by reinforcing successive approximations. Key: People learn stepwise. Industrial: Use guided setup, wizards, and “successive unlocking” of features. Examples: Training modes; step-by-step calibration. Pitfalls: Removing scaffolding too early or never. Heuristic: Scaffold early, fade support later. Train: Q: “What is step 1 behavior?” A: “Define safe minimum.” Q: “What’s next approximation?” A: “Add one complexity.” Prompt: “Design a progression plan.” 

Signal-to-Noise Ratio
Def: The clarity of a message depends on how much relevant signal stands above irrelevant noise. Key: Reduce noise before amplifying signal. Industrial: Simplify dashboards, labels, alarms; remove decorative clutter near controls. Examples: Minimal control panel; clear alarm tones. Pitfalls: Loud but meaningless alarms. Heuristic: Delete noise, then highlight signal. Train: Q: “What is the signal?” A: “Primary state/action.” Q: “What is noise?” A: “Everything else.” Prompt: “Reduce elements by 20%.” 

Similarity
Def: Similar-looking elements are perceived as related. Key: Consistent coding improves grouping and prediction. Industrial: Make similar functions look similar; differentiate different functions clearly. Examples: Identical knobs for same type of control. Pitfalls: Similar forms for different functions (dangerous). Heuristic: Similar = same; different = different. Train: Q: “What does similarity imply here?” A: “Same role.” Q: “Where must we break similarity?” A: “High-risk mismatches.” Prompt: “Audit look-alike controls.” 

Stickiness
Def: Designs become memorable and behavior-changing when they are simple, concrete, emotional, and repeatable. Key: Memory favors distinctive, meaningful cues. Industrial: Use clear slogans for safety, distinctive form cues, and story-based onboarding. Examples: “Pull to stop” with unique handle shape. Pitfalls: Over-branding that distracts from function. Heuristic: Make the core message short, concrete, and testable. Train: Q: “What is the one takeaway?” A: “Write a 7-word line.” Q: “What makes it memorable?” A: “Distinct cue + repetition.” Prompt: “Design one signature cue.” 

Storytelling
Def: Narratives help users understand purpose, sequence, and meaning. Key: Stories compress causality and motivate action. Industrial: Use scenario-based instructions and “why this matters” framing for safety and maintenance. Examples: “If you smell gas…” flow; user journey cards. Pitfalls: Long stories in urgent contexts. Heuristic: Use micro-stories: situation → action → outcome. Train: Q: “What scenario triggers this?” A: “Define context.” Q: “What is the desired action?” A: “Make it explicit.” Prompt: “Write a 3-step micro-story.” 

Structural Forms
Def: Basic forms (arches, trusses, shells) carry predictable strength and meaning. Key: Structure is both engineering and visual language. Industrial: Choose structural forms matching loads and communicating sturdiness or lightness. Examples: Ribbing; honeycomb cores. Pitfalls: Cosmetic structure with weak internals. Heuristic: Let structure do real work, then show it honestly. Train: Q: “What loads exist?” A: “Compression, bending, torsion.” Q: “Which structural form fits?” A: “Select accordingly.” Prompt: “Make a load path diagram.” 

Symmetry
Def: Symmetry tends to be perceived as stable, orderly, and “correct,” though asymmetry can add interest. Key: Symmetry improves quick parsing and assembly. Industrial: Use symmetry where orientation errors are costly; break symmetry to enforce correct orientation when needed. Examples: Symmetric grip; asymmetric connector keying. Pitfalls: Symmetry that enables wrong assembly. Heuristic: Symmetric for usability; asymmetric for error-proofing. Train: Q: “Should it be reversible?” A: “If yes, symmetry helps.” Q: “Should it be idiot-proof?” A: “If yes, break symmetry.” Prompt: “List orientation error risks.” 

Threat Detection
Def: People prioritize cues that might indicate danger, sometimes overreacting. Key: Threat bias can hijack attention. Industrial: Make real hazards unambiguous; avoid “false threat” aesthetics that cause stress. Examples: Sharp hazard icons; clear alarm tone. Pitfalls: Over-warning causing alarm fatigue. Heuristic: Reserve high-salience alarms for real hazards. Train: Q: “What is the true hazard?” A: “Define severity.” Q: “What cue matches it?” A: “Scale salience to risk.” Prompt: “Audit alarm frequency.” 

Three-Dimensional Projection
Def: 3D cues can be represented on 2D surfaces via perspective and shading, shaping interpretation. Key: Depth cues influence perceived affordances. Industrial: Use embossing, shading, and perspective carefully in displays and markings to imply press/drag. Examples: Raised button illusion; isometric diagrams. Pitfalls: Fake 3D that implies wrong interaction. Heuristic: Use depth cues only when interaction matches. Train: Q: “Does it look pressable?” A: “Then it must be.” Q: “Are shading cues consistent?” A: “Keep lighting consistent.” Prompt: “Test with first-time users.” 

Top-Down Lighting Bias
Def: People often assume light comes from above, affecting shape-from-shading interpretation. Key: Lighting priors influence perceived convex/concave. Industrial: Place highlights/shadows consistent with “light from above” to avoid misread icons and surfaces. Examples: Toggle shading; embossed warnings. Pitfalls: Inverting shading and reversing perceived state. Heuristic: Keep lighting logic consistent across UI/CMF. Train: Q: “Where is the implied light source?” A: “Above (and often slightly left).” Q: “Do shadows flip meaning?” A: “Check pressed/unpressed.” Prompt: “Audit all shaded icons.” 

Uncanny Valley
Def: Near-human likeness can become eerie when realism is close but imperfect. Key: Almost-human triggers revulsion more than clearly non-human. Industrial: For humanoid robots/avatars, choose stylized design or push realism convincingly; avoid “almost.” Examples: Stylized assistant robot. Pitfalls: Dead eyes, mismatched motion, odd skin. Heuristic: Either abstract or perfect the realism; don’t hover in between. Train: Q: “How humanlike is it?” A: “Pick a lane.” Q: “What breaks realism?” A: “Motion, eyes, skin.” Prompt: “User test for eeriness early.” 

Uncertainty Principle
Def: In complex systems, you can’t eliminate uncertainty; you can only manage it with information and flexibility. Key: Users hate ambiguity about state and outcomes. Industrial: Show system state, progress, and constraints; design graceful degradation. Examples: Battery estimate ranges; “checking…” indicators. Pitfalls: False precision. Heuristic: Reduce uncertainty where it matters, acknowledge it where it can’t be removed. Train: Q: “What is uncertain here?” A: “State, timing, outcomes.” Q: “How do we communicate it?” A: “Ranges, status, next steps.” Prompt: “List unknowns user faces.” 

Uniform Connectedness
Def: Elements visually connected are perceived as belonging together more strongly than proximity alone. Key: Connection beats closeness. Industrial: Use borders, lines, panels, and physical brackets to show grouping. Examples: Group box around settings; linked buttons on a panel. Pitfalls: Over-connecting causes grouping confusion. Heuristic: Connect only true groups. Train: Q: “Which controls belong together?” A: “Connect them.” Q: “Which must be independent?” A: “Avoid shared containers.” Prompt: “Replace proximity with explicit grouping.” 

Veblen Effect
Def: For some goods, higher price or “luxury cues” can increase desirability by signaling status. Key: Status signaling is real; relevance depends on category. Industrial: In luxury products, use craftsmanship cues honestly; avoid wasteful “status-only” choices when sustainability matters. Examples: Metal unibody; tight tolerances. Pitfalls: Confusing luxury cues with actual quality. Heuristic: If you signal premium, deliver premium reliability. Train: Q: “Is this a status good?” A: “Define target market.” Q: “What signals status?” A: “Materials, scarcity, brand.” Prompt: “Separate status cues from functional benefits.” 

Visibility
Def: Users should be able to see available actions and current state without hunting. Key: Hidden state causes errors. Industrial: Make modes obvious; show locked/unlocked; expose key affordances. Examples: Visible power state LED; clear mode icon. Pitfalls: Hidden gestures; invisible modes. Heuristic: If the user must remember it, it’s not visible enough. Train: Q: “What state is currently active?” A: “Make it perceivable.” Q: “What actions are available?” A: “Show or cue them.” Prompt: “Design a ‘state dashboard’.” 

Visuospatial Resonance
Def: Image interpretation can change with viewing distance because spatial frequencies become more or less visible. Key: Distance filters detail; design for intended viewing distance. Industrial: For graphics, signage, and textures, control which information appears near vs far. Examples: Hybrid images; signage legible from afar. Pitfalls: Critical info only visible at wrong distance. Heuristic: Specify viewing distance first, then design spatial frequency. Train: Q: “What distance must it read from?” A: “Define near/mid/far.” Q: “What info belongs at each?” A: “Core vs detail.” Prompt: “Test prints at real distances.” 

von Restorff Effect
Def: Distinctive items in a set are more likely to be remembered. Key: Contrast creates memorability. Industrial: Make emergency controls visually distinct; make critical steps stand out. Examples: Red e-stop; unique shape key. Pitfalls: Too many “distinct” items dilute the effect. Heuristic: Make one thing stand out per context, and make it the right thing. Train: Q: “What must be remembered?” A: “Make it distinctive.” Q: “What else is competing?” A: “Remove competing distinctiveness.” Prompt: “Design a single standout cue.” 

Wabi-Sabi
Def: An aesthetic valuing imperfection, impermanence, and authenticity. Key: Patina can signal honesty and warmth. Industrial: Use materials that age gracefully; design wear paths intentionally. Examples: Leather patina; brushed metal that hides scratches. Pitfalls: Using “wabi-sabi” to excuse poor quality. Heuristic: Distinguish intentional patina from failure. Train: Q: “What should age well?” A: “High-touch surfaces.” Q: “What must stay precise?” A: “Interfaces and seals.” Prompt: “Define acceptable wear patterns.” 

Waist-to-Hip Ratio
Def: Body proportions can bias attractiveness judgments in some contexts and cultures. Key: It’s an observed effect, not a design mandate, and is socially sensitive. Industrial: Use cautiously in character/avatar design; avoid reinforcing harmful norms. Examples: Fashion illustration; character modeling. Pitfalls: Ethical harm and exclusion. Heuristic: Treat human-body “appeal” levers as optional and accountable. Train: Q: “Why is this body cue included?” A: “Justify ethically.” Q: “Who might it exclude?” A: “Identify impacted groups.” Prompt: “Prefer diverse representations.” 

Wayfinding
Def: Designing cues that help people navigate spaces and systems. Key: Navigation uses landmarks, paths, and clear feedback. Industrial: In hospitals, transit, kiosks, and complex devices, make “you are here,” “where next,” and “how to back out” obvious. Examples: Mall maps; device menu breadcrumbs. Pitfalls: Sign overload and inconsistent naming. Heuristic: Provide orientation, route, confirmation, and rescue. Train: Q: “Where am I?” A: “Show current location/state.” Q: “How do I get back?” A: “Provide escape routes.” Prompt: “Design a landmark system.” 

Weakest Link
Def: System reliability is often determined by its most failure-prone component or dependency. Key: One weak component can dominate outcomes. Industrial: Identify and reinforce critical components, supply chain risks, and maintenance pain points. Examples: Cheap hinge causing warranty spikes; fragile cable. Pitfalls: Optimizing non-critical parts. Heuristic: Strengthen the dominant failure path first. Train: Q: “What fails most often?” A: “Field data + FMEA.” Q: “What’s the cascade?” A: “Map dependencies.” Prompt: “Rank components by failure impact.” 