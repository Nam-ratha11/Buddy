/**
 * ingest_text.js — Ingest hardcoded NCERT 7th Grade Science textbook content
 * directly into the vector store (no PDF files needed).
 * Usage: node ingest_text.js
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { LocalIndex } = require('vectra');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const embeddingModel = genAI.getGenerativeModel({ model: 'gemini-embedding-001' });
const INDEX_DIR = path.join(__dirname, 'vector-store');

// ─── NCERT 7th Grade Science Content ────────────────────────────────────────

const LESSONS = [
  {
    source: 'NCERT_7_Science_Ch1_Nutrition_in_Plants',
    chunks: [
      "Nutrition in Plants - Grade 7 NCERT Science. All organisms require food. Plants can make their food themselves but animals including humans cannot. They get it from plants or animals that eat plants. Thus, humans and animals are directly or indirectly dependent on plants.",
      "Autotrophs: The mode of nutrition in which organisms make food themselves from simple substances is called autotrophic (auto = self; trophos = nourishment) nutrition. Therefore, plants are called autotrophs. ",
      "Heterotrophs: Animals and most other organisms take in food prepared by plants. They are called heterotrophs (heteros = other).",
      "Photosynthesis: Leaves are the food factories of plants. Therefore, all the raw materials must reach the leaf. Water and minerals present in the soil are absorbed by the roots and transported to the leaves.",
      "Chlorophyll and Photosynthesis: The leaves have a green pigment called chlorophyll. It helps leaves to capture the energy of the sunlight. This energy is used to synthesise (prepare) food from carbon dioxide and water. Since the synthesis of food occurs in the presence of sunlight, it is called photosynthesis.",
      "Other Modes of Nutrition in Plants: There are some plants which do not have chlorophyll. They cannot prepare food. Like humans and animals such plants depend on the food produced by other plants. They use the heterotrophic mode of nutrition. Example: Cuscuta (Amarbel) is a parasite.",
      "Insectivorous Plants: There are a few plants which can trap insects and digest them. Such insect-eating plants are called insectivorous plants. Example: Pitcher plant. The pitcher-like structure is the modified part of leaf.",
      "Saprotrophs: The mode of nutrition in which organisms take in nutrients from dead and decaying matter is called saprotrophic nutrition. Such organisms with saprotrophic mode of nutrition are called saprotrophs. Fungi (Fungus) are saprotrophs.",
      "Symbiosis: Some organisms live together and share both shelter and nutrients. This relationship is called symbiosis.",
    ]
  },
  {
    source: 'NCERT_7_Science_Ch3_Electricity_Circuits_Components',
    chunks: [
      "Electricity: Circuits and their Components - Grade 7 NCERT Science. Electricity is generated in multiple ways — by windmills, wind energy, solar panels capturing the Sun's energy, by falling water and by using natural gas or coal. The electric supply from these sources reaches our homes and factories via wires.",
      "Electric cell: An electric cell is a portable source of electrical energy. All electric cells have two terminals; one is called positive (+ve) while the other is negative (–ve). The metal cap is the positive terminal of the electric cell and the metal disc is the negative terminal.",
      "Battery: A combination of two or more cells is called a battery. The positive terminal of one cell is connected to the negative terminal of the next cell. Connecting more than one cell provides energy to the circuit for a longer time and/or more energy.",
      "Incandescent Lamp: The thin wire inside the glass bulb of the lamp glows. The glowing thin wire is called the filament of the lamp. In incandescent lamps, the filament gets hot and glows to produce light. The filament is attached to two thicker wires that support it. One thick wire connects to the metal case at the lamp's base, while the other connects to the metal tip at the centre of the base.",
      "LED Lamp: Many torches in use today have a Light Emitting Diode (LED) lamp. Unlike incandescent lamps, LEDs do not have filaments. They also have two terminals, but one is positive (attached to a longer wire) and the other is negative (the shorter wire). Electric current can pass through the LED in one direction only. The current passes through the LED only when the positive terminal (longer wire) of the LED is connected to the positive terminal of the battery, and negative terminal (shorter wire) of the LED is connected to the negative terminal of the battery.",
      "Electrical Circuit: The lamp glows when one terminal of the lamp is connected to one terminal of the electric cell and the other terminal of the lamp to the other terminal of the cell. This setup forms an electrical circuit, which provides a complete path for electric current to flow through the lamp. The lamp glows only when current passes through the circuit. The direction of electric current in an electrical circuit is taken to be from the positive to the negative terminal of the electric cell.",
      "Electric Switch: A switch is a simple device that either completes or breaks a circuit. When the safety pin touches both drawing pins, it closes the gap and completes the path, and allows the current to flow — this is the ON position where the circuit is closed. When the safety pin does not touch the second drawing pin, the gap in the circuit prevents current flow — this is the OFF position where the circuit is open.",
      "Circuit Diagrams: A representation of an electrical circuit using symbols is called its circuit diagram. In the symbol for an electric cell, the long line represents the positive terminal, while the short line represents the negative terminal. In the symbol for an LED, the triangle points to the direction in which the current can flow.",
      "Electrical Conductors and Insulators: Materials through which electric current can flow easily are called good conductors, or conductors of electricity. Materials through which current cannot pass through are called insulators, or poor conductors of electricity. Metals are conductors of electricity. Silver, copper, and gold are the best electrical conductors. For making electrical wires, mainly copper is used due to its comparatively lower cost and abundant supply. Plastic, rubber, and ceramics are electrical insulators used to cover wires, plug tops, and switches to protect people from electric shocks.",
      "Safety with Electricity: The danger signs on electric poles and other appliances warn people that electricity can be dangerous if not carefully handled. Never ever perform experiments with power supply at your home or school. Use only batteries or cells for experiments with electricity. Our body is a conductor of electricity. Electric current passing through our body may cause severe injury or even death. Never touch switches or plugs with wet hands.",
      "DC and AC: Electricity from batteries usually powers small devices and is of a type called Direct Current (DC). The electricity from power plants that come to the wall socket is known as Alternating Current (AC) and can run larger appliances.",
    ]
  },
  {
    source: 'NCERT_7_Science_Ch4_World_of_Metals_NonMetals',
    chunks: [
      "The World of Metals and Non-metals - Grade 7 NCERT Science. Metals like copper, aluminium, and iron are lustrous in appearance and are hard. Lustre shown by metals is known as metallic lustre. Some metals like sodium and potassium are so soft that they can be cut with a knife. Mercury is found in a liquid state at room temperature.",
      "Malleability: The property by which materials can be beaten into thin sheets is called malleability. Most metals possess this property. Gold and silver are the most malleable metals. Thin silver foil on some sweets and aluminium foil used for wrapping food items are formed due to their malleability. Coal and sulfur are brittle — they break into pieces when hammered.",
      "Ductility: The property of materials by which they can be drawn into wires is called ductility. This property of ductility is mainly possessed by metals. Gold is so ductile that one gram of it can be drawn into a 2 kilometre-long wire. Coal and sulfur are not ductile.",
      "Sonority: The property of metals that enables them to produce a ringing sound is called sonority, and metals are said to be sonorous in nature. Coal and wood produce dull sounds when dropped.",
      "Conduction of Heat: Metals are good conductors of heat, whereas wood is a poor conductor of heat. The transfer of heat from one point to another of a material is called conduction. Metal vessels are used for cooking, and their handles are made with wood or other materials that do not conduct heat.",
      "Conduction of Electricity: Materials that allow electricity to flow through them easily are called good conductors of electricity. Materials that prevent electricity from passing through them are called poor conductors of electricity. All metals (aluminium, iron, copper) are good conductors of electricity. Sulfur, coal, wood, stone, eraser, and nylon rope are poor conductors.",
      "Rusting of Iron: Iron objects develop brown deposits (rust) when left in the open for a few days. The presence of both water and air is essential for rust to develop. Moist air is responsible for the development of brown deposits on objects made of iron. The process of formation of rust on objects made of iron is called rusting. The rusting of iron can be prevented by painting, oiling, greasing, and galvanisation (applying a protective layer of zinc metal on iron).",
      "Corrosion: Gradual deterioration of metal surfaces caused by air, water, or other substances is known as corrosion. Green coating forms on copper objects; black coating forms on silver objects. The Iron Pillar of Delhi was made more than 1600 years ago and has barely any rust, showing ancient Indian metallurgy skills.",
      "Effect of Air on Metals: Magnesium ribbon burns with a dazzling white flame and changes into a white powder called magnesium oxide. It is formed due to the reaction between magnesium and oxygen present in the air. Magnesium oxide solution is basic in nature — it changes red litmus paper to blue. Generally, oxides of metals are basic in nature.",
      "Non-metals: Substances like sulfur and phosphorus behave differently with air and water than metals. Non-metals are usually soft and dull in appearance. They are neither malleable nor ductile, and they are not sonorous. They are also poor conductors of heat and electricity. Their oxides are acidic in nature. Some non-metals are oxygen, hydrogen, nitrogen, carbon, sulfur, phosphorus. Metals and non-metals are sub-categories of substances called elements. An element is a substance that cannot be broken down into simpler substances. Presently 118 elements are known.",
      "Importance of Non-metals: Oxygen is a non-metal essential for breathing. Carbon is the building block of all life forms — a key component of proteins, fats, and carbohydrates. Nitrogen is used in manufacturing fertilisers. Chlorine is used in water purification. Iodine solution is applied on wounds as an antiseptic.",
    ]
  },
  {
    source: 'NCERT_7_Science_Ch5_Physical_Chemical_Changes',
    chunks: [
      "Changes Around Us: Physical and Chemical - Grade 7 NCERT Science. We observe changes occurring around us with the help of our senses of sight, smell, touch, hearing, and taste.",
      "Physical Changes: Changes in which only physical properties like shape, size, and state of substances change are called physical changes. No new substance is formed in a physical change. Examples: melting ice cubes, boiling water, folding paper, crushing chalk, inflating a balloon.",
      "Chemical Changes: Changes in which one or more new substances are formed are called chemical changes. New substances are formed through a process called chemical reaction. Example: blowing air into lime water turns it milky because carbon dioxide reacts with lime water to form calcium carbonate (insoluble white substance). Calcium hydroxide + Carbon dioxide → Calcium carbonate + Water.",
      "Rusting as Chemical Change: In the rusting of iron, a new brown-coloured substance called rust (iron oxide) is formed. Thus, rusting is a chemical change because it involves the formation of a new substance.",
      "Combustion: A chemical reaction in which a substance reacts with oxygen and produces heat and/or light is called combustion. Substances that undergo combustion reactions are called combustible substances. Examples: wood, paper, cotton, kerosene. The burning of magnesium ribbon: Magnesium + Oxygen → Magnesium oxide + Heat + Light. Oxygen is required for combustion.",
      "Ignition Temperature: The minimum temperature at which a substance catches fire is called its ignition temperature. For the combustion process to occur, three requirements are needed: (i) A combustible substance (fuel), (ii) Oxygen, (iii) Heat that allows the fuel to reach its ignition temperature. This is called the fire triangle.",
      "Burning of a Candle: The burning of a candle involves both physical and chemical changes. The wax melts (physical change), is carried up the wick, and evaporates (physical change). The vapour of wax burns to produce a flame (chemical change).",
      "Reversible and Irreversible Changes: Some changes can be reversed — when ice melts, it can be refrozen into ice; when water evaporates, it can be condensed back. Some changes cannot be reversed — chopped vegetables cannot return to their original size, making popcorn cannot go back to its original form.",
      "Desirable and Undesirable Changes: Many useful changes happen in daily life — changing of milk into curd, ripening of fruits, cooking of food. These are desirable changes. Rusting of iron and decay of food are undesirable changes. Decomposition of food can be useful in converting food waste into compost.",
      "Weathering of Rocks: Physical and chemical changes in rocks are collectively called weathering, which eventually leads to the formation of soil. Temperature changes, growing roots of trees, and freezing of water within cracks can cause rocks to break (physical changes). Water or chemicals in water can react with rocks causing chemical changes.",
      "Erosion: The process by which rock pebbles, soil, and sediments are broken down and moved from one location to another by natural forces like wind and flowing water is called erosion. Erosion during a landslide is an example of a physical change.",
    ]
  },
  {
    source: 'NCERT_7_Science_Ch2_Exploring_Substances_Acidic_Basic_Neutral',
    chunks: [
      "Exploring Substances: Acidic, Basic, and Neutral - Grade 7 NCERT Science. Substances around us may be classified as acidic, basic, and neutral in nature.",
      "Litmus as an Indicator: Litmus is a natural substance obtained from lichens. It is available both as a solution and in the form of paper strips. Substances that turn blue litmus paper to red are acidic in nature, while those that turn red litmus paper to blue are basic in nature. Since litmus shows different colours in acidic and basic solutions, it is called an acid-base indicator.",
      "Acids: Substances that taste sour tend to contain acids and are acidic in nature. Examples of acidic substances: lemon juice (citric acid), amla juice (ascorbic acid and citric acid), tamarind water (tartaric acid), vinegar (acetic acid). These substances turn blue litmus paper to red.",
      "Bases: Basic substances are generally slippery to touch and taste bitter. Examples: soap solution, baking soda solution, lime water, washing powder solution. These substances turn red litmus paper to blue.",
      "Neutral Substances: Substances that do not change the colour of either litmus paper are neutral — neither acidic nor basic. Examples: tap water, sugar solution, salt solution.",
      "Natural Indicators: Red rose extract gives red colour in acidic solutions and green colour in basic solutions. Turmeric paper can be used to test basic substances — the yellow colour of turmeric turns red in basic solutions but remains unchanged in acidic and neutral solutions. Other natural indicators: beetroot, purple cabbage, Indian blackberry (jamun), red hibiscus (gudhal) flower.",
      "Olfactory Indicators: There are some substances whose odours change in an acidic or basic medium. These are called olfactory indicators. Example: onion strips — their odour changes in basic medium (baking soda solution) but not in acidic medium (tamarind water).",
      "Neutralisation Reaction: When the solution of an acid is mixed with the solution of a base in sufficient quantity, the resulting solution is neither acidic nor basic. Such reactions are called neutralisation reactions. In a neutralisation reaction, salt and water are formed with the evolution of heat. Acid + Base → Salt + Water + Heat.",
      "Neutralisation in Daily Life: When an ant bites, it injects formic acid into the skin. The effect can be neutralised by rubbing moist baking soda (a base). When soil is too acidic, plants do not grow well — it can be treated with lime (a base). If soil is basic, organic matter like manure and composted leaves are added to neutralise it. Factory waste that is acidic can be neutralised by adding basic substances before releasing into water bodies.",
    ]
  }
];

// ─── Embedding and Indexing ──────────────────────────────────────────────────

async function embedText(text) {
  const result = await embeddingModel.embedContent(text);
  return result.embedding.values;
}

async function ingest() {
  const index = new LocalIndex(INDEX_DIR);
  if (!await index.isIndexCreated()) {
    await index.createIndex();
    console.log('Vector store created at', INDEX_DIR);
  }

  let total = 0;
  for (const lesson of LESSONS) {
    console.log(`\nIndexing: ${lesson.source}`);
    for (let i = 0; i < lesson.chunks.length; i++) {
      const vector = await embedText(lesson.chunks[i]);
      await index.insertItem({
        vector,
        metadata: {
          source: lesson.source,
          chunk: i,
          text: lesson.chunks[i],
        },
      });
      total++;
      process.stdout.write(`\r  ${i + 1}/${lesson.chunks.length} chunks`);
    }
    console.log(`\n  Done.`);
  }

  console.log(`\nIngestion complete. ${total} chunks indexed.`);
}

ingest().catch(console.error);
