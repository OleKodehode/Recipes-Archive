// HTML elements needed
const recipesContainer = document.getElementById("recipes-container");
const inputForm = document.getElementById("add-new-container");
const addNewRecipeBtn = document.getElementById("add-new-btn");
const newRecipeNameInput = document.getElementById("recipe-name-container");
const newRecipeTypeInput = document.getElementById("recipe-types");
const newRecipeLinkInput = document.getElementsByClassName("recipe-inputs");
const newRecipeDialog = document.getElementById("add-new-dialog");
const deleteRecipeDialog = document.getElementById("delete-dialog");
const closeBtns = document.querySelectorAll(".close-btn, .cancel-btn"); // close and cancel buttons have the same functionality basically
const confirmBtns = document.querySelectorAll(".confirm-btn");
const addMoreBtn = document.getElementById("add-more-btn");
const deleteMsg = document.getElementById("delete-msg");

// Regex for links
const linkRegex = /(?:https?:\/\/)?(?:www\.)?([^.]+)\.[^\s]+(?:\/[^\s]*)?/gi;

// stored in let to allow fetching and replacing the array from LocalStorage
// recipes are stored as objects with keys: name(str), type(str), , link(str), id(crypto.randomUUID())
let recipes = [];
let filters = null; // Switching the value of this variable in code
let recipeToDelete = null; // used for deletions

// Evenet listener for the form for adding new recipes to the archive
inputForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const formData = new FormData(inputForm);
  const nameInput = formData.get("recipe-name");
  const typeInput = formData.get("recipe-type");
  const linkInput = formData.get("recipe-link");

  if (!nameInput || !linkInput) {
    return alert(
      `One or more fields are left empty.\nPlease fill out the form.`
    );
  }

  recipes.push({
    name: nameInput,
    type: typeInput,
    link: linkInput,
    id: crypto.randomUUID(),
  });

  newRecipeNameInput.value = "";
  newRecipeTypeInput.value = "";
  newRecipeLinkInput.value = "";

  saveRecipesToStorage();
  renderPage();
});

// Close and cancel buttons for the dialog
closeBtns.forEach((button) => {
  button.addEventListener("click", () => {
    recipeToDelete = null; // Clear the variable
    deleteRecipeDialog.close();
  });
});

// button for deleting recipes in the dialog
confirmBtns.forEach((button) => {
  button.addEventListener("click", () => {
    if (recipeToDelete) {
      // just an extra check just in case
      // I'm being destructive to the original array here - But I think that's fine? It should only remove one item at a time.
      recipes = recipes.filter((recipe) => recipe.id !== recipeToDelete);
      saveRecipesToStorage();
      renderPage();
      recipeToDelete = null; // reset the ID after deletion
    } else {
      deleteRecipeDialog.close();
      return alert("Something went wrong. Please try again.");
    }
    deleteRecipeDialog.close();
  });
});

const saveRecipesToStorage = () => {
  localStorage.setItem("recipes", JSON.stringify(recipes));
};

const openDeleteModal = (recipe) => {
  recipeToDelete = recipe.id; // keep track of the recipe ID for deletion. Gets set to null if the user closes the dialog
  const domainName = recipe.link.match(linkRegex); // to get the domain name again

  deleteMsg.textContent = `Are you sure you want to delete "${recipe.name}" from ${domainName}?`;
  deleteRecipeDialog.showModal();
};

const filterRecipes = (recipes) => {};

const buildPage = (recipes) => {
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

    const linkToRecipe = document.createElement("a");
    linkToRecipe.setAttribute("href", recipe.link);
    linkToRecipe.setAttribute("target", "_blank");
    linkToRecipe.textContent = recipe.link.replace(
      linkRegex,
      (_, domain) => `Link to recipe @ ${domain}`
    );

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "🗑";
    deleteBtn.classList.add("delete-btn");
    deleteBtn.addEventListener("click", () => {
      openDeleteModal(recipe);
    });

    recipeCard.append(nameElement, typeElemenet, linkToRecipe, deleteBtn);
    recipesContainer.append(recipeCard);
  });
};

const renderPage = () => {
  const savedRecipes = localStorage.getItem("recipes");
  if (savedRecipes) recipes = JSON.parse(savedRecipes);
  buildPage(recipes);
};

renderPage();
