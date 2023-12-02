console.log(window.location.pathname);
console.log(window.location.search);

let params = new URLSearchParams(document.location.search);
let name = params.get("something"); // is the string "Jonathan"
console.log(name);
console.log(params)

const myFunction = async (event) => {
	event.preventDefault();
	const {
	  target: {
	    username: { value: username },
	    password: { value: password },
		},
	} = event;
	const url = "/api/register";
	const response = await fetch(url,
	{
		body: JSON.stringify({"username":username,"password":password}),
		method:"POST"
	});
	const { detail } = await response.json();
	
	alert(detail)
}


