// HTML elements needed
const recipesContainer = document.getElementById("recipes-container");
const inputForm = document.getElementById("add-new-container");
const addNewRecipeBtn = document.getElementById("add-new-btn");
const newRecipeNameInput = document.getElementById("recipe-name-container");
const newRecipeTypeInput = document.getElementById("recipe-types");
const newRecipeLinkInput = document.getElementById("recipe-link");
const newRecipeDialog = document.getElementById("add-new-dialog");
const deleteRecipeDialog = document.getElementById("delete-dialog");
const closeBtns = document.querySelectorAll(".close-btn, .cancel-btn"); // close and cancel buttons have the same functionality basically
const confirmBtns = document.querySelectorAll(".confirm-btn");
const addMoreBtn = document.getElementById("add-more-btn");
const deleteMsg = document.getElementById("delete-msg");
const filterSection = document.getElementById("filter-section");
const categorySelect = document.getElementById("category-select");
const sortSelect = document.getElementById("sort-select");

// Regex for links
const linkRegex = /(?:https?:\/\/)?(?:www\.)?([^.]+)\.[^\s]+(?:\/[^\s]*)?/i;
const recipeCategories = [
  "breakfast",
  "lunch",
  "dinner",
  "dessert",
  "snacks",
  "other",
];

// stored in let to allow fetching and replacing the array from LocalStorage
// recipes are stored as objects with keys: name(str), type(str), , link(str), id(crypto.randomUUID())
let recipes = [];
let recipeToDelete = null; // used for deletions
let selectedCategory = "";
let selectedSort = "";

// Evenet listener for the form for adding new recipes to the archive
inputForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const formData = new FormData(inputForm);
  const nameInput = formData.get("recipe-name").trim();
  const typeInput = formData.get("recipe-type"); // no need to trim - Not direct user input
  let linkInput = formData.get("recipe-link").trim();

  if (!nameInput || !linkInput) {
    return alert(
      `One or more fields are left empty.\nPlease fill out the form.`
    );
  }

  // hrefs needs a protocoll, so if there is none, add https://
  if (!/^https?:\/\//i.test(linkInput)) {
    linkInput = "https://" + linkInput;
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
    // just an extra check just in case
    if (recipeToDelete) {
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

categorySelect.addEventListener("change", (e) => {
  selectedCategory = e.target.value;

  // Don't show the category in sort if there is a category filter on
  const categorySortOption = sortSelect.querySelector('option[value="type"]');
  if (selectedCategory) {
    categorySortOption.hidden = true;
    // if category has been chosen in the sort then reset it.
    if (selectedSort === "type") {
      selectedSort = "";
      sortSelect.value = "";
    }
  } else {
    categorySortOption.hidden = false;
  }

  renderPage();
});

sortSelect.addEventListener("change", (e) => {
  selectedSort = e.target.value;
  renderPage(); // filtering and sorting is handled by a function called in renderPage
});

const saveRecipesToStorage = () => {
  localStorage.setItem("recipes", JSON.stringify(recipes));
};

const openDeleteModal = (recipe) => {
  recipeToDelete = recipe.id; // keep track of the recipe ID for deletion. Gets set to null if the user closes the dialog
  const match = recipe.link.match(linkRegex); // to get the domain name again. Matches with full link as index 0, domain name as index 1
  const domainName = match ? match[1] : recipe.link;

  deleteMsg.textContent = `Are you sure you want to delete the recipe "${recipe.name}"? [Recipe from ${domainName}]`;
  deleteRecipeDialog.showModal();
};

const filterRecipes = (recipes) => {
  let filteredRecipes = [...recipes]; //destructuring to make a copy of the recipes array.
  // check if there is a filter first
  if (selectedCategory) {
    filteredRecipes = filteredRecipes.filter(
      (recipe) => recipe.type === selectedCategory
    );
  }

  // sort if there is any sort selected
  // using localeCompare instead of > / < for handling non-english letters, case sensitivity, and accented letters
  switch (selectedSort) {
    case "name-asc":
      filteredRecipes.sort((a, b) => a.name.localeCompare(b.name));
      break;

    case "name-desc":
      filteredRecipes.sort((a, b) => b.name.localeCompare(a.name));
      break;

    case "type":
      filteredRecipes.sort((a, b) => a.type.localeCompare(b.type));
      break;
  }

  return filteredRecipes;
};

const populateCategoryFilter = () => {
  // to dynamically add in categories to the filter dropdown.
  // using a new Set to only get unique entries, and destructuring it into an array for easier data handling.
  const categories = [
    ...new Set(
      recipes.map((recipe) => recipe.type).sort((a, b) => a.localeCompare(b))
    ),
  ];
  // making sure the filter by category dropdown always has this option
  categorySelect.innerHTML = '<option value="">Show all categories</option>';

  categories.forEach((category) => {
    const categoryOption = document.createElement("option");
    categoryOption.value = category;
    categoryOption.textContent =
      category.charAt(0).toUpperCase() + category.slice(1); // Making sure the category is capitalized.
    categorySelect.append(categoryOption);
  });

  categorySelect.value = selectedCategory; // Making sure the currently selected category stays
};

// Debounce function for timeouts, for editing and saving
function debounce(func, delay) {
  let timeout, previousArgs, previousThis;
  const debounced = function (...args) {
    previousArgs = args;
    previousThis = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(previousThis, previousArgs), delay);
  };
  debounced.flush = function () {
    clearTimeout(timeout);
    if (previousArgs) {
      func.apply(previousThis, previousArgs);
      previousArgs = previousThis = undefined;
    }
  };
  return debounced;
}

const updateRecipe = debounce((id, field, value) => {
  const recipeToEdit = recipes.find((recipe) => recipe.id === id);
  if (!recipeToEdit) return;

  // if a field is left empty, re-render to restore the original value
  if (!value.trim()) {
    renderPage();
    return;
  }

  // Like with submitting a new recipe, need to check for protocol in links
  if (field === "link" && !/^https?:\/\//i.test(value)) {
    value = "https://" + value.trim();
  }

  recipeToEdit[field] = value.trim();
  saveRecipesToStorage();
  renderPage();
}, 5000); // 5 second timer

// for cancelling an edit
const revertField = (element, originalValue) => {
  element.value = originalValue;
};

const attachEditHandler = (card, recipe) => {
  const fieldsToEdit = [
    { element: card.querySelector(".recipe-name"), field: "name" },
    { element: card.querySelector(".recipe-type-edit"), field: "type" },
    { element: card.querySelector(".recipe-link-edit"), field: "link" },
  ];

  fieldsToEdit.forEach(({ element, field }) => {
    element.addEventListener("input", (e) =>
      updateRecipe(recipe.id, field, e.target.value)
    );

    element.addEventListener("blur", (e) => {
      const next = e.relatedTarget;
      const stillEditingInsideCard =
        next &&
        e.currentTarget.closest(".recipe-card") ===
          next.closest(".recipe-card") &&
        next.matches(".recipe-name, .recipe-type-edit, .recipe-link-edit");

      console.log(next);

      if (stillEditingInsideCard) {
        return;
      }

      updateRecipe(recipe.id, field, e.target.value);
      updateRecipe.flush();
    });
    element.addEventListener("keydown", (e) => {
      if (e.key === "Enter") element.blur();
      if (e.key === "Escape") revertField(element, recipe[field]);
    });
  });
};

const buildPage = (recipes) => {
  recipesContainer.replaceChildren();

  recipes.forEach((recipe) => {
    const { name, type, link } = recipe;
    const recipeCard = document.createElement("article");
    recipeCard.classList.add("recipe-card", type);

    const nameElement = document.createElement("input");
    nameElement.setAttribute("type", "text");
    nameElement.classList.add("recipe-name");
    nameElement.value = name;
    nameElement.addEventListener("focus", () => {
      // The card should go into edit mode once the name input has been clicked.
      if (!recipeCard.classList.contains("editing")) {
        recipeCard.classList.toggle("editing");
        typeEdit.classList.toggle("hidden");
        linkEdit.classList.toggle("hidden");
        editBtn.textContent = "💾";
      }
    });

    const typeElement = document.createElement("p");
    typeElement.classList.add("recipe-type");
    typeElement.textContent = type;

    // for editing category
    const typeEdit = document.createElement("select");
    typeEdit.classList.add("recipe-type-edit", "hidden");
    recipeCategories.forEach((category) => {
      const option = document.createElement("option");
      option.value = category;
      option.textContent = category;
      if (category === type) option.selected = true;
      typeEdit.append(option);
    });

    const linkToRecipe = document.createElement("a");
    linkToRecipe.setAttribute("href", link);
    linkToRecipe.setAttribute("target", "_blank");
    linkToRecipe.textContent = link.replace(
      linkRegex,
      (_, domain) => `Link to recipe @ ${domain}`
    );

    // for editing links later
    const linkEdit = document.createElement("input");
    linkEdit.type = "url";
    linkEdit.value = link;
    linkEdit.classList.add("hidden", "recipe-link-edit");

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "🗑";
    deleteBtn.classList.add("delete-btn");
    deleteBtn.addEventListener("click", () => {
      openDeleteModal(recipe);
    });

    const editBtn = document.createElement("button");
    editBtn.textContent = "✎";
    editBtn.classList.add("edit-btn");
    editBtn.addEventListener("click", () => {
      const isEditing = recipeCard.classList.toggle("editing");

      typeEdit.classList.toggle("hidden");
      linkEdit.classList.toggle("hidden");

      if (isEditing) {
        editBtn.textContent = "💾";
      } else {
        editBtn.textContent = "✎";
        updateRecipe(recipe.id, "name", nameElement.value);
        updateRecipe(recipe.id, "type", typeEdit.value);
        updateRecipe(recipe.id, "link", linkEdit.value);
        updateRecipe.flush();

        console.log(`trying to save category as ${typeEdit.value}`);
        console.log(`saved as ${recipe.type}`);

        typeElement.textContent = typeEdit.value;
        linkToRecipe.href = linkEdit.value;
        linkToRecipe.textContent = linkEdit.value.replace(
          linkRegex,
          (_, domain) => `Link to recipe @ ${domain}`
        );
      }
    });

    recipeCard.append(
      nameElement,
      typeElement,
      typeEdit,
      linkToRecipe,
      linkEdit,
      deleteBtn,
      editBtn
    );

    recipesContainer.append(recipeCard);
    attachEditHandler(recipeCard, recipe);
  });
};

const renderPage = () => {
  const savedRecipes = localStorage.getItem("recipes");
  if (savedRecipes) recipes = JSON.parse(savedRecipes);

  if (recipes.length > 0) {
    filterSection.classList.remove("hidden");
    populateCategoryFilter();
  } else {
    filterSection.classList.add("hidden");
  }
  const processRecipes = filterRecipes(recipes);
  buildPage(processRecipes);
};

renderPage();
