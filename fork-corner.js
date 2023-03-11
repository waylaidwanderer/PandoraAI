export default function initForkCorner() {
    const fchead = document.getElementsByTagName('head')[0];
    const fcController = document.getElementById('fork-corner');
    const fcIcon = document.createElement('i');

    const fcDevicon = document.createElement('link');
    fcDevicon.rel = 'stylesheet';
    fcDevicon.type = 'text/css';
    fcDevicon.href = 'https://cdn.jsdelivr.net/gh/devicons/devicon@master/devicon.min.css';

    const fcElement = document.createElement('div');

    // default icon and theme
    if (document.querySelector('.fc-theme-git')) {
        fcIcon.setAttribute('class', 'devicon-git-plain');
    }

    // github icon and theme
    if (document.querySelector('.fc-theme-github')) {
        fcIcon.setAttribute('class', 'devicon-github-plain');
    }

    // gitlab icon and theme
    if (document.querySelector('.fc-theme-gitlab')) {
        fcIcon.setAttribute('class', 'devicon-gitlab-plain');
    }

    // bitbucket icon and theme
    if (document.querySelector('.fc-theme-bitbucket')) {
        fcIcon.setAttribute('class', 'devicon-bitbucket-plain');
    }

    // insert icons to the head
    fchead.appendChild(fcDevicon);

    // insert icon inside controller
    fcController.appendChild(fcIcon);
    fcController.parentNode.insertBefore(fcElement, fcController.nextSibling);
}
