const recipesContainer = document.getElementById("recipes-container");
const inputForm = document.getElementById("add-new-container");
const addNewRecipeBtn = document.getElementById("add-new-btn");
const newRecipeInput = document.getElementById("recipe-name-container");
const newRecipeDialog = document.getElementById("add-new-dialog");
const deleteRecipeDialog = document.getElementById("delete-dialog");

// stored in let to allow fetching and replacing the array from LocalStorage
// recipes are stored as objects with keys: name(str), type(str), ingredients(array of str), link(str)
let recipes = [
  {
    name: "test",
    type: "middag",
    ingredients: ["Tomat", "Ost", "Fløte"],
    link: "https://www.tastyrecipes.com/pancakes",
  },
];
let filters = null; // Switching the value of this variable in code

inputForm.addEventListener("submit", (e) => {
  e.preventDefault();
  newRecipeInput.value = "";
});

const saveRecipesToStorage = () => {
  localStorage.setItem("recipes", JSON.stringify(recipes));
};

const filterRecipes = (recipes) => {};

const buildPage = (recipes) => {
  const linkRegex = /(?:https?:\/\/)?(?:www\.)?([^.]+)\.[^\s]+(?:\/[^\s]*)?/gi;

  recipesContainer.replaceChildren();

  recipes.forEach((recipe) => {
    const recipeCard = document.createElement("article");
    recipeCard.classList.add("recipe-card", recipe.type);

    const nameElement = document.createElement("input");
    nameElement.setAttribute("type", "text");
    nameElement.classList.add("recipe-name");
    nameElement.value = recipe.name;

    const typeElemenet = document.createElement("p");
    typeElemenet.classList.add("recipe-type");
    typeElemenet.textContent = recipe.type;

    const ingredientsElement = document.createElement("details");
    const ingredientsSummary = document.createElement("summary");
    const ingredientsList = document.createElement("ul");

    ingredientsSummary.textContent = "Ingredients";

    recipe.ingredients.forEach((ingredient) => {
      const listItem = document.createElement("li");
      listItem.textContent = ingredient;
      ingredientsList.append(listItem);
    });

    ingredientsElement.append(ingredientsSummary, ingredientsList);

    const linkToRecipe = document.createElement("a");
    linkToRecipe.setAttribute("href", recipe.link);
    linkToRecipe.setAttribute("target", "_blank");
    linkToRecipe.textContent = recipe.link.replace(
      linkRegex,
      (_, domain) => `Link to recipe @ ${domain}`
    );

    recipeCard.append(
      nameElement,
      typeElemenet,
      ingredientsElement,
      linkToRecipe
    );
    recipesContainer.append(recipeCard);
  });
};

const renderPage = () => {
  const savedRecipes = localStorage.getItem("recipes");
  if (savedRecipes) recipes = JSON.parse(savedRecipes);
  buildPage(recipes);
};

renderPage();
