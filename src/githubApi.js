const getFilesFromGitUrl = async (url) => {
    const [_, __, userName, repoName] = url.split('/')
    const url = `https://api.github.com/repos/${userName}/${repoName}/contents`
    const files = []
    const response = await fetch(url)
    const data = await response.json()
    for (const file of data) {
        const data = await fetch(file.download_url)
        files.push({
            name: file.name,
            content: await data.text()
        })
    }
    return files
}

// const urlParams = new URLSearchParams(window.location.search); 
// const myParam = urlParams.get('github');
// if(!myParam) {}