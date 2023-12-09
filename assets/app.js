const checkPurpose = () => {
  if (window.location.href.includes("sign-in")) {
    document.querySelector("h1").innerHTML = "Sign In";

    const nodes = ["a", "br"].map((tag) => document.createElement(tag));

    const anchor = nodes.find((node) => node.tagName === "A");
    anchor.setAttribute("href", "/register");
    anchor.innerText = "don't have an account? sign up!";

    const form = document.getElementById("form_id");

    nodes.forEach((node) => {
      form.after(node);
    });

    form.setAttribute("onsubmit", "return signIn(event)");
  }
};

const signIn = async (event) => {
  event.preventDefault();
  const {
    target: {
      username: { value: username },
      password: { value: password },
    },
  } = event;
  const url = "/api/sign-in";
  const response = await fetch(url, {
    body: JSON.stringify({ username: username, password: password }),
    method: "POST",
  });
  const { status } = response;
  const { detail, token } = await response.json();
  if (status == 200) {
    document.cookie = `token=${token}`;
  }
  alert(detail, status);
};

const signUp = async (event) => {
  event.preventDefault();
  const {
    target: {
      username: { value: username },
      password: { value: password },
    },
  } = event;
  const url = "/api/register";
  const response = await fetch(url, {
    body: JSON.stringify({ username: username, password: password }),
    method: "POST",
  });
  const { status } = response;
  const { detail } = await response.json();

  alert(detail);

  if (status === 200) {
    const {
      location: { href: uri },
    } = window;
    window.location.replace(uri.replace("/register", "/"));
  }
};
