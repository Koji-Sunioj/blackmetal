const checkPurpose = () => {
  if (window.location.href.includes("sign-in")) {
    document.querySelector("h1").innerHTML = "Sign In";
    document
      .querySelector("form")
      .setAttribute("onsubmit", "return signIn(event)");
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
  const url = "http://localhost/api/sign-in";
  const response = await fetch(url, {
    body: JSON.stringify({ username: username, password: password }),
    method: "POST",
  });
  const { status } = response;
  const { detail, header } = await response.json();
  const myHeaders = new Headers();
  myHeaders.set("Authorization", header);
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
