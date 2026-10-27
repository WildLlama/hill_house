function isInView(element) {
  const rect = element.getBoundingClientRect();
  console.log(element.id + ": " + rect.top);
  if (Math.abs(rect.top) >= 0 && Math.abs(rect.top) < 150) {
    //Assumed Y-offset for 1st section
    return element.id; //Assuming it returns 1 for 1st element
  } else if (rect.top > 150) {
    return element.id; //Returns 2 for 2nd element
  }
}

function addActive() {
  document.addEventListener("scroll", () => {
    let sections = document.querySelectorAll("section"); //Get all the sections
    let nav = document.querySelectorAll("nav.chapters a"); //Get all the navigation links

    // Array.from(sections).forEach(section => { section.classList.remove('active') });
    Array.from(nav).forEach((navItem) => {
      navItem.classList.remove("active");
    });

    console.clear();
    for (section of sections) {
      if (isInView(section) == section.id) {
        let activeNav = document.querySelector(
          `nav.chapters a[href="#${section.id}"]`,
        ); //Get the navigation link for this section
        if (activeNav) {
          activeNav.classList.add("active"); //Only apply active class to this nav link
        }
        break;
      }
    }
  });
}

window.onload = addActive();
