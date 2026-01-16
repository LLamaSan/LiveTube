// TODO: Create a script to seed categories.

import { db } from "@/db";
import { categories } from "@/db/schema";

const categoryNames = [
    "Cars and vehicles",
    "Comedy",
    "Education",
    "Gaming",
    "Entertainment",
    "Film and animation",
    "How-to and style", 
    "Music",
    "Art",
    "News",
    "Politics",
    "Pets and animals",
    "Science and technology",
    "Sports",
    "Travel and Adventure",
];

async function main() {
    console.log("Seeding Catgegories...");

    try{
        const values = categoryNames.map((name) => ({
            name, 
            description: `Videos related to ${name.toLowerCase()}`,
        }));    
        await db.insert(categories).values(values);

        console.log("Categories seeded successfully!");
    } catch (error) {
        console.error("Error seeding categories:",error);
        process.exit(1);
    }
};

main();