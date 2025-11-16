<div class="heading">
    <h1>Create Face</h1>
    <a class="btn" href="/">Back</a>
</div>

<div class="form">
    <div class="form-field">
        <label for="name">Name</label>
        <input placeholder="Test Face" type="text" id="name" class="input" />
        <p class="form-field__description">Give this face a name</p>
    </div>

    <button class="btn btn--large btn--span btn--primary">Create</button>
</div>

<style>
    .heading {
        display: flex;
        flex-flow: row;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
    }

    .heading > h1 {
        font-size: 1.25rem;
    }

    .form {
        display: flex;
        flex-flow: column;
        gap: 1rem;
    }

    .form-field {
        display: flex;
        flex-flow: column;
        gap: 0.5rem;
    }

    .form-field__description {
        font-size: 0.8rem;
        color: #999;
    }
</style>
